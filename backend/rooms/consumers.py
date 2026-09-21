import json
import logging
from datetime import timedelta
from django.utils import timezone
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, RoomParticipant, ArenaSession, AnswerEvaluation
from .questions import get_random_question, QUESTION_BANK
from .ai_evaluator import evaluate_transcript

logger = logging.getLogger(__name__)

class SignalingConsumer(AsyncJsonWebsocketConsumer):
    # Active peers in rooms: {room_code: {peer_id: {channel_name, username, is_muted, is_camera_off, is_screen_sharing}}}
    room_peers = {}
    # Active session state per room: {room_code: {session_id, question, speaker_order, turn_index, time_limit, expires_at, evaluations, is_paused, remaining_seconds}}
    room_sessions = {}
    # Raised hands per room: {room_code: [peer_id, ...]}
    room_hand_raises = {}

    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code'].upper()
        self.room_group_name = f"room_{self.room_code}"
        self.peer_id = None
        self.username = None

        await self.accept()

    async def disconnect(self, close_code):
        if self.room_code in self.room_peers:
            # Find any peers associated with this peer_id or this channel_name
            stale_pids = [
                pid for pid, pinfo in self.room_peers[self.room_code].items()
                if pid == self.peer_id or pinfo.get('channel_name') == self.channel_name
            ]
            for pid in stale_pids:
                p_username = self.room_peers[self.room_code][pid].get('username', self.username)
                del self.room_peers[self.room_code][pid]

                # Also remove from raised hands if present
                if self.room_code in self.room_hand_raises and pid in self.room_hand_raises[self.room_code]:
                    self.room_hand_raises[self.room_code].remove(pid)
                    await self._broadcast_hand_raises()

                # Broadcast user-left to room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'broadcast_event',
                        'message': {
                            'type': 'user-left',
                            'peerId': pid,
                            'username': p_username
                        }
                    }
                )
                await self.mark_participant_left(self.room_code, pid)

            if self.room_code in self.room_peers and not self.room_peers[self.room_code]:
                del self.room_peers[self.room_code]
            if self.room_code in self.room_hand_raises and not self.room_hand_raises[self.room_code]:
                del self.room_hand_raises[self.room_code]

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        msg_type = content.get('type')

        # WebRTC & Room Core
        if msg_type == 'join-room':
            await self.handle_join_room(content)
        elif msg_type == 'leave-room':
            await self.handle_leave_room(content)
        elif msg_type == 'offer':
            await self.handle_offer(content)
        elif msg_type == 'answer':
            await self.handle_answer(content)
        elif msg_type == 'ice-candidate':
            await self.handle_ice_candidate(content)
        elif msg_type == 'media-state':
            await self.handle_media_state(content)
        elif msg_type == 'chat-message':
            await self.handle_chat_message(content)
        elif msg_type == 'ping':
            await self.send_json({'type': 'pong'})

        # Hand Raise Interactions
        elif msg_type == 'raise-hand':
            await self.handle_raise_hand(content)
        elif msg_type == 'lower-hand':
            await self.handle_lower_hand(content)

        # Arena Discussion Game Loop & Timers & AI
        elif msg_type == 'start-arena-session':
            await self.handle_start_arena_session(content)
        elif msg_type == 'next-turn':
            await self.handle_next_turn(content)
        elif msg_type == 'extend-time':
            await self.handle_extend_time(content)
        elif msg_type == 'pause-timer':
            await self.handle_pause_timer(content)
        elif msg_type == 'resume-timer':
            await self.handle_resume_timer(content)
        elif msg_type == 'submit-transcript':
            await self.handle_submit_transcript(content)
        elif msg_type == 'live-caption':
            await self.handle_live_caption(content)
        elif msg_type == 'end-arena-session':
            await self.handle_end_arena_session(content)

    async def handle_join_room(self, content):
        self.peer_id = content.get('peerId')
        self.username = content.get('username', 'Anonymous Peer')
        is_muted = content.get('isMuted', False)
        is_camera_off = content.get('isCameraOff', False)

        # Add this consumer channel to room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        if self.room_code not in self.room_peers:
            self.room_peers[self.room_code] = {}

        # Only prune if the exact same socket channel or exact same peerId was already registered
        stale_pids = [
            pid for pid, pinfo in self.room_peers[self.room_code].items()
            if pid == self.peer_id or pinfo.get('channel_name') == self.channel_name
        ]
        for stale_pid in stale_pids:
            logger.info(f"Pruning stale channel connection {stale_pid}")
            del self.room_peers[self.room_code][stale_pid]
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'message': {
                        'type': 'user-left',
                        'peerId': stale_pid,
                        'username': self.username
                    }
                }
            )
            await self.mark_participant_left(self.room_code, stale_pid)

        # Collect existing participants before adding the new one
        existing = [
            {
                'peerId': pid,
                'username': pinfo['username'],
                'isMuted': pinfo.get('is_muted', False),
                'isCameraOff': pinfo.get('is_camera_off', False),
                'isScreenSharing': pinfo.get('is_screen_sharing', False)
            }
            for pid, pinfo in self.room_peers[self.room_code].items()
            if pid != self.peer_id
        ]

        # Register self in memory
        self.room_peers[self.room_code][self.peer_id] = {
            'channel_name': self.channel_name,
            'username': self.username,
            'is_muted': is_muted,
            'is_camera_off': is_camera_off,
            'is_screen_sharing': False
        }

        # Save to DB
        await self.record_participant_join(self.room_code, self.peer_id, self.username)

        # 1. Send existing participants back to the newly joined peer
        active_session = self.room_sessions.get(self.room_code)
        hand_raises = self._get_hand_raises()
        await self.send_json({
            'type': 'existing-participants',
            'participants': existing,
            'myPeerId': self.peer_id,
            'activeSession': active_session,
            'handRaises': hand_raises
        })

        # 2. Notify other participants in the room that a new peer joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'user-joined',
                    'peerId': self.peer_id,
                    'username': self.username,
                    'isMuted': is_muted,
                    'isCameraOff': is_camera_off
                },
                'sender_channel': self.channel_name
            }
        )

    async def handle_leave_room(self, content):
        peer_id = content.get('peerId') or self.peer_id
        if self.room_code in self.room_peers and peer_id in self.room_peers[self.room_code]:
            p_username = self.room_peers[self.room_code][peer_id].get('username', self.username)
            del self.room_peers[self.room_code][peer_id]
            if not self.room_peers[self.room_code]:
                del self.room_peers[self.room_code]

            # Remove from hand raises if present
            if self.room_code in self.room_hand_raises and peer_id in self.room_hand_raises[self.room_code]:
                self.room_hand_raises[self.room_code].remove(peer_id)
                await self._broadcast_hand_raises()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'message': {
                        'type': 'user-left',
                        'peerId': peer_id,
                        'username': p_username
                    }
                }
            )
            await self.mark_participant_left(self.room_code, peer_id)

    async def handle_offer(self, content):
        target_peer_id = content.get('targetPeerId')
        target_channel = self._get_peer_channel(target_peer_id)
        if target_channel:
            await self.channel_layer.send(
                target_channel,
                {
                    'type': 'direct_message',
                    'message': {
                        'type': 'offer',
                        'senderPeerId': self.peer_id,
                        'targetPeerId': target_peer_id,
                        'sdp': content.get('sdp'),
                        'username': self.username
                    }
                }
            )

    async def handle_answer(self, content):
        target_peer_id = content.get('targetPeerId')
        target_channel = self._get_peer_channel(target_peer_id)
        if target_channel:
            await self.channel_layer.send(
                target_channel,
                {
                    'type': 'direct_message',
                    'message': {
                        'type': 'answer',
                        'senderPeerId': self.peer_id,
                        'targetPeerId': target_peer_id,
                        'sdp': content.get('sdp')
                    }
                }
            )

    async def handle_ice_candidate(self, content):
        target_peer_id = content.get('targetPeerId')
        target_channel = self._get_peer_channel(target_peer_id)
        if target_channel:
            await self.channel_layer.send(
                target_channel,
                {
                    'type': 'direct_message',
                    'message': {
                        'type': 'ice-candidate',
                        'senderPeerId': self.peer_id,
                        'targetPeerId': target_peer_id,
                        'candidate': content.get('candidate')
                    }
                }
            )

    async def handle_media_state(self, content):
        if self.room_code in self.room_peers and self.peer_id in self.room_peers[self.room_code]:
            peer_info = self.room_peers[self.room_code][self.peer_id]
            if 'isMuted' in content:
                peer_info['is_muted'] = content['isMuted']
            if 'isCameraOff' in content:
                peer_info['is_camera_off'] = content['isCameraOff']
            if 'isScreenSharing' in content:
                peer_info['is_screen_sharing'] = content['isScreenSharing']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'media-state',
                    'peerId': self.peer_id,
                    'isMuted': content.get('isMuted'),
                    'isCameraOff': content.get('isCameraOff'),
                    'isScreenSharing': content.get('isScreenSharing')
                }
            }
        )

    async def handle_chat_message(self, content):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'chat-message',
                    'peerId': self.peer_id,
                    'senderName': self.username,
                    'text': content.get('text', ''),
                    'timestamp': content.get('timestamp')
                }
            }
        )

    # -------------------------------------------------------------
    # Hand Raise System
    # -------------------------------------------------------------

    def _get_hand_raises(self):
        if self.room_code not in self.room_hand_raises:
            return []
        raised_list = []
        peers_dict = self.room_peers.get(self.room_code, {})
        for pid in self.room_hand_raises[self.room_code]:
            uname = peers_dict.get(pid, {}).get('username', 'Participant')
            raised_list.append({'peerId': pid, 'username': uname})
        return raised_list

    async def _broadcast_hand_raises(self):
        hand_raises = self._get_hand_raises()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'hand-raise-updated',
                    'handRaises': hand_raises
                }
            }
        )

    async def handle_raise_hand(self, content):
        if self.room_code not in self.room_hand_raises:
            self.room_hand_raises[self.room_code] = []
        if self.peer_id and self.peer_id not in self.room_hand_raises[self.room_code]:
            self.room_hand_raises[self.room_code].append(self.peer_id)
        await self._broadcast_hand_raises()

    async def handle_lower_hand(self, content):
        target_peer_id = content.get('peerId') or self.peer_id
        if self.room_code in self.room_hand_raises and target_peer_id in self.room_hand_raises[self.room_code]:
            self.room_hand_raises[self.room_code].remove(target_peer_id)
        await self._broadcast_hand_raises()

    # -------------------------------------------------------------
    # Arena Game Loop & Synchronized Timers & AI Handlers
    # -------------------------------------------------------------

    async def handle_start_arena_session(self, content):
        topic = content.get('topic', 'System Design')
        time_limit = int(content.get('timeLimit', 60))
        custom_question = content.get('customQuestion')

        if custom_question and custom_question.get('question'):
            question_data = custom_question
        else:
            question_data = get_random_question(topic)

        # Build speaker order from active room peers
        peers_dict = self.room_peers.get(self.room_code, {})
        speaker_order = list(peers_dict.keys())
        if not speaker_order and self.peer_id:
            speaker_order = [self.peer_id]

        first_speaker_id = speaker_order[0] if speaker_order else self.peer_id
        now = timezone.now()
        expires_at = now + timedelta(seconds=time_limit)

        session_state = {
            'topic': topic,
            'question': question_data,
            'speakerOrder': speaker_order,
            'currentSpeakerPeerId': first_speaker_id,
            'turnIndex': 0,
            'timeLimit': time_limit,
            'startedAt': now.isoformat(),
            'expiresAt': expires_at.isoformat(),
            'status': 'ACTIVE',
            'isPaused': False,
            'remainingSeconds': time_limit,
            'evaluations': {}
        }

        self.room_sessions[self.room_code] = session_state

        # Save to DB
        await self.record_session_start(self.room_code, topic, question_data['question'], first_speaker_id, time_limit, expires_at)

        # Broadcast to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'session-started',
                    'session': session_state
                }
            }
        )

    async def handle_extend_time(self, content):
        session = self.room_sessions.get(self.room_code)
        if not session or session.get('status') != 'ACTIVE':
            return
        
        seconds = int(content.get('seconds', 30))
        if session.get('isPaused'):
            session['remainingSeconds'] = session.get('remainingSeconds', 0) + seconds
            new_expires = None
        else:
            try:
                current_exp = timezone.datetime.fromisoformat(session['expiresAt'])
            except Exception:
                current_exp = timezone.now()
            new_exp = current_exp + timedelta(seconds=seconds)
            session['expiresAt'] = new_exp.isoformat()
            new_expires = session['expiresAt']

        session['timeLimit'] = session.get('timeLimit', 60) + seconds

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'timer-extended',
                    'seconds': seconds,
                    'expiresAt': new_expires,
                    'remainingSeconds': session.get('remainingSeconds'),
                    'timeLimit': session['timeLimit']
                }
            }
        )

    async def handle_pause_timer(self, content):
        session = self.room_sessions.get(self.room_code)
        if not session or session.get('status') != 'ACTIVE' or session.get('isPaused'):
            return

        now = timezone.now()
        try:
            exp = timezone.datetime.fromisoformat(session['expiresAt'])
            remaining = max(0, int((exp - now).total_seconds()))
        except Exception:
            remaining = session.get('timeLimit', 60)

        session['isPaused'] = True
        session['remainingSeconds'] = remaining

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'timer-paused',
                    'remainingSeconds': remaining
                }
            }
        )

    async def handle_resume_timer(self, content):
        session = self.room_sessions.get(self.room_code)
        if not session or session.get('status') != 'ACTIVE' or not session.get('isPaused'):
            return

        remaining = session.get('remainingSeconds', 30)
        now = timezone.now()
        new_expires_at = now + timedelta(seconds=remaining)
        session['isPaused'] = False
        session['expiresAt'] = new_expires_at.isoformat()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'timer-resumed',
                    'expiresAt': session['expiresAt'],
                    'remainingSeconds': remaining
                }
            }
        )

    async def handle_next_turn(self, content):
        session = self.room_sessions.get(self.room_code)
        if not session or session['status'] != 'ACTIVE':
            return

        speaker_order = session['speakerOrder']
        next_turn_index = session['turnIndex'] + 1

        if next_turn_index < len(speaker_order):
            # Advance to next speaker
            next_speaker_id = speaker_order[next_turn_index]
            now = timezone.now()
            expires_at = now + timedelta(seconds=session['timeLimit'])

            session['turnIndex'] = next_turn_index
            session['currentSpeakerPeerId'] = next_speaker_id
            session['expiresAt'] = expires_at.isoformat()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'message': {
                        'type': 'turn-changed',
                        'turnIndex': next_turn_index,
                        'currentSpeakerPeerId': next_speaker_id,
                        'expiresAt': expires_at.isoformat()
                    }
                }
            )
        else:
            # Round complete!
            session['status'] = 'FINISHED'
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'message': {
                        'type': 'session-completed',
                        'evaluations': session.get('evaluations', {})
                    }
                }
            )

    async def handle_submit_transcript(self, content):
        transcript = content.get('transcript', '')
        speaker_peer_id = content.get('peerId', self.peer_id)
        speaker_name = content.get('username', self.username)

        session = self.room_sessions.get(self.room_code)
        if not session or session.get('status') != 'ACTIVE':
            return

        turn_index = session.get('turnIndex', 0)
        evaluated_turns = session.setdefault('evaluated_turns', set())
        turn_key = f"{turn_index}_{speaker_peer_id}"

        if turn_key in evaluated_turns:
            logger.info(f"[Arena] Duplicate transcript submission ignored for {turn_key}")
            return

        evaluated_turns.add(turn_key)
        question_data = session.get('question', {})

        # Run AI Evaluation
        eval_result = await evaluate_transcript(question_data, transcript, speaker_name)
        eval_result['peerId'] = speaker_peer_id
        eval_result['transcript'] = transcript

        # Save evaluation to memory & DB
        if 'evaluations' not in session:
            session['evaluations'] = {}
        session['evaluations'][speaker_peer_id] = eval_result

        await self.record_evaluation(self.room_code, speaker_peer_id, speaker_name, transcript, eval_result)

        # Broadcast evaluation scorecard to all peers in room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'evaluation-result',
                    'peerId': speaker_peer_id,
                    'evaluation': eval_result
                }
            }
        )

    async def handle_live_caption(self, content):
        # Broadcast live speech subtitles to all other peers
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'live-caption',
                    'peerId': self.peer_id,
                    'speakerName': self.username,
                    'text': content.get('text', ''),
                    'isFinal': content.get('isFinal', False)
                },
                'sender_channel': self.channel_name
            }
        )

    async def handle_end_arena_session(self, content):
        if self.room_code in self.room_sessions:
            del self.room_sessions[self.room_code]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'message': {
                    'type': 'session-ended'
                }
            }
        )

    async def broadcast_event(self, event):
        if event.get('sender_channel') == self.channel_name:
            return
        await self.send_json(event['message'])

    async def direct_message(self, event):
        await self.send_json(event['message'])

    def _get_peer_channel(self, peer_id):
        if self.room_code in self.room_peers:
            peer_data = self.room_peers[self.room_code].get(peer_id)
            if peer_data:
                return peer_data.get('channel_name')
        return None

    @database_sync_to_async
    def record_participant_join(self, room_code, peer_id, username):
        try:
            room = Room.objects.get(code=room_code)
            RoomParticipant.objects.update_or_create(
                room=room,
                peer_id=peer_id,
                defaults={
                    'username': username,
                    'is_active': True,
                    'left_at': None
                }
            )
        except Room.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_participant_left(self, room_code, peer_id):
        try:
            RoomParticipant.objects.filter(
                room__code=room_code,
                peer_id=peer_id
            ).update(is_active=False, left_at=timezone.now())
        except Exception:
            pass

    @database_sync_to_async
    def record_session_start(self, room_code, topic, question_text, current_speaker, duration, expires_at):
        try:
            room = Room.objects.get(code=room_code)
            ArenaSession.objects.create(
                room=room,
                topic=topic,
                question_text=question_text,
                current_speaker_peer_id=current_speaker,
                duration_seconds=duration,
                status='ACTIVE',
                expires_at=expires_at
            )
        except Exception as e:
            logger.warning(f"Could not record session in DB: {e}")

    @database_sync_to_async
    def record_evaluation(self, room_code, peer_id, participant_name, transcript, eval_result):
        try:
            room = Room.objects.get(code=room_code)
            active_session = room.sessions.filter(status='ACTIVE').last()
            if active_session:
                AnswerEvaluation.objects.create(
                    session=active_session,
                    participant_name=participant_name,
                    peer_id=peer_id,
                    transcript=transcript,
                    technical_score=eval_result.get('technicalScore', 0.0),
                    clarity_score=eval_result.get('clarityScore', 0.0),
                    relevance_score=eval_result.get('relevanceScore', 0.0),
                    total_score=eval_result.get('totalScore', 0),
                    feedback_summary=eval_result.get('summary', '')
                )
        except Exception as e:
            logger.warning(f"Could not record evaluation in DB: {e}")
