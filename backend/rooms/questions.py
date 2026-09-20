"""
Curated Question Bank for Study Arena Discussion Rounds
"""

QUESTION_BANK = [
    {
        "id": "sd_1",
        "topic": "System Design",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "How would you design a rate limiter for an API with millions of requests per minute? Compare Token Bucket vs Leaky Bucket algorithms.",
        "keywords": ["token bucket", "leaky bucket", "redis", "sliding window", "distributed", "concurrency", "rate limiting"]
    },
    {
        "id": "sd_2",
        "topic": "System Design",
        "difficulty": "Hard",
        "time_limit": 60,
        "question": "Explain Database Sharding vs Database Partitioning. How do you handle cross-shard queries and rebalancing without downtime?",
        "keywords": ["sharding", "partitioning", "horizontal", "vertical", "hash", "range", "rebalancing", "consistency"]
    },
    {
        "id": "sd_3",
        "topic": "System Design",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Explain the CAP Theorem and give a real-world scenario where you would choose Availability over Strong Consistency.",
        "keywords": ["consistency", "availability", "partition tolerance", "eventual consistency", "nosql", "dynamodb", "cassandra"]
    },
    {
        "id": "dsa_1",
        "topic": "Algorithms",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Explain how Dijkstra's algorithm works for shortest path. What is its time complexity and why does it fail with negative edge weights?",
        "keywords": ["dijkstra", "priority queue", "min heap", "greedy", "negative weights", "bellman-ford", "time complexity"]
    },
    {
        "id": "dsa_2",
        "topic": "Algorithms",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Compare Hash Tables vs Balanced BSTs (like Red-Black Trees). When would you prefer a tree over a hash map?",
        "keywords": ["hash table", "hash map", "red-black tree", "bst", "ordering", "collisions", "range queries", "o(1)", "o(log n)"]
    },
    {
        "id": "web_1",
        "topic": "Web & Distributed",
        "difficulty": "Easy",
        "time_limit": 60,
        "question": "What is the difference between WebSockets, Server-Sent Events (SSE), and Long Polling? When should each be used?",
        "keywords": ["websocket", "sse", "long polling", "bidirectional", "http", "overhead", "full-duplex", "real-time"]
    },
    {
        "id": "web_2",
        "topic": "Web & Distributed",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "How does WebRTC achieve peer-to-peer audio and video streaming? What are the specific roles of STUN, TURN, and Signaling?",
        "keywords": ["webrtc", "stun", "turn", "nat", "ice", "sdp", "peer-to-peer", "signaling", "udp", "rtp"]
    },
    {
        "id": "beh_1",
        "topic": "Behavioral",
        "difficulty": "Easy",
        "time_limit": 60,
        "question": "Tell me about a time you had a technical disagreement with a teammate. How did you resolve it and what was the outcome?",
        "keywords": ["disagreement", "data-driven", "compromise", "collaboration", "empathy", "trade-offs", "resolution"]
    },
    {
        "id": "beh_2",
        "topic": "Behavioral",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Describe a critical production outage or bug you caused or helped resolve. What was the root cause and how did you prevent recurrence?",
        "keywords": ["outage", "postmortem", "root cause", "monitoring", "rollback", "testing", "resilience"]
    }
]

def get_questions_by_topic(topic=None):
    if not topic or topic == "All":
        return QUESTION_BANK
    return [q for q in QUESTION_BANK if q["topic"].lower() == topic.lower()]

def get_random_question(topic=None):
    import random
    questions = get_questions_by_topic(topic)
    return random.choice(questions) if questions else QUESTION_BANK[0]
