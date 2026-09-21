"""
Curated Question Bank for Study Arena Discussion Rounds
Comprehensive multi-domain engineering question bank with technical keywords and time limits.
"""

QUESTION_BANK = [
    # ==========================================
    # 1. System Design & Scalability
    # ==========================================
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
        "id": "sd_4",
        "topic": "System Design",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "How would you design a distributed cache like Redis or Memcached? How do you handle cache invalidation, cache avalanche, and cache stampede?",
        "keywords": ["cache invalidation", "cache stampede", "cache avalanche", "ttl", "lru", "consistent hashing", "write-through", "write-back"]
    },
    {
        "id": "sd_5",
        "topic": "System Design",
        "difficulty": "Hard",
        "time_limit": 60,
        "question": "Design a real-time notification system supporting Push Notifications, SMS, and Email for 50 million active users. How do you guarantee delivery?",
        "keywords": ["message queue", "kafka", "rabbitmq", "idempotency", "retries", "exponential backoff", "dead letter queue", "fcm"]
    },

    # ==========================================
    # 2. Algorithms & Data Structures
    # ==========================================
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
        "id": "dsa_3",
        "topic": "Algorithms",
        "difficulty": "Hard",
        "time_limit": 60,
        "question": "How do you implement an LRU (Least Recently Used) Cache with O(1) get and put operations? Explain the underlying data structure choices.",
        "keywords": ["lru cache", "doubly linked list", "hash map", "eviction", "head", "tail", "o(1)"]
    },
    {
        "id": "dsa_4",
        "topic": "Algorithms",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Explain Dynamic Programming with Memoization vs Tabulation. How would you apply DP to solve the 0/1 Knapsack problem?",
        "keywords": ["dynamic programming", "memoization", "tabulation", "subproblems", "optimal substructure", "overlapping subproblems", "knapsack"]
    },
    {
        "id": "dsa_5",
        "topic": "Algorithms",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Explain the difference between BFS (Breadth-First Search) and DFS (Depth-First Search). In what scenarios is BFS strictly better than DFS?",
        "keywords": ["bfs", "dfs", "queue", "stack", "shortest path", "tree traversal", "graph", "level order"]
    },

    # ==========================================
    # 3. Web & Distributed Systems
    # ==========================================
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
        "id": "web_3",
        "topic": "Web & Distributed",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Explain HTTP/2 vs HTTP/3. How does HTTP/3 with QUIC solve the Head-of-Line (HoL) blocking problem of TCP?",
        "keywords": ["http/2", "http/3", "quic", "udp", "tcp", "multiplexing", "head of line blocking", "tls", "handshake"]
    },
    {
        "id": "web_4",
        "topic": "Web & Distributed",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "What is Idempotency in REST APIs and distributed payment processing? How do you implement idempotent POST requests?",
        "keywords": ["idempotency", "idempotency key", "retry", "payment", "put vs post", "deduplication", "database constraint"]
    },
    {
        "id": "web_5",
        "topic": "Web & Distributed",
        "difficulty": "Hard",
        "time_limit": 60,
        "question": "How do distributed consensus algorithms like Raft or Paxos work? How do nodes elect a leader and maintain log replication consistency?",
        "keywords": ["raft", "paxos", "consensus", "leader election", "log replication", "quorum", "heartbeat", "split vote"]
    },

    # ==========================================
    # 4. DevOps & Cloud Architecture
    # ==========================================
    {
        "id": "devops_1",
        "topic": "DevOps & Cloud",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Explain Kubernetes Architecture: what are the roles of the Control Plane (API Server, etcd, Scheduler) and Worker Nodes (Kubelet, Kube-Proxy)?",
        "keywords": ["kubernetes", "k8s", "control plane", "api server", "etcd", "kubelet", "kube-proxy", "scheduler", "pod"]
    },
    {
        "id": "devops_2",
        "topic": "DevOps & Cloud",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Compare Blue-Green Deployments vs Canary Deployments vs Rolling Updates. What are the trade-offs regarding cost and rollback speed?",
        "keywords": ["blue green", "canary", "rolling update", "zero downtime", "traffic routing", "rollback", "load balancer"]
    },
    {
        "id": "devops_3",
        "topic": "DevOps & Cloud",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "What is the difference between Docker Containers and Virtual Machines (VMs)? How do Linux namespaces and cgroups enable container isolation?",
        "keywords": ["docker", "container", "virtual machine", "hypervisor", "namespaces", "cgroups", "kernel", "isolation"]
    },
    {
        "id": "devops_4",
        "topic": "DevOps & Cloud",
        "difficulty": "Hard",
        "time_limit": 60,
        "question": "How do you implement Observability in microservices across Metrics, Logs, and Distributed Tracing (e.g. OpenTelemetry, Jaeger)?",
        "keywords": ["observability", "metrics", "logs", "distributed tracing", "opentelemetry", "trace id", "span", "prometheus"]
    },

    # ==========================================
    # 5. Behavioral & Engineering Leadership
    # ==========================================
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
    },
    {
        "id": "beh_3",
        "topic": "Behavioral",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "How do you balance Technical Debt vs shipping new product features under tight deadlines? Give an example of how you prioritized.",
        "keywords": ["technical debt", "refactoring", "trade-off", "prioritization", "stakeholders", "velocity", "maintenance"]
    },
    {
        "id": "beh_4",
        "topic": "Behavioral",
        "difficulty": "Medium",
        "time_limit": 60,
        "question": "Tell me about a time you mentored a junior engineer or onboarded a new team member. How did you help them become productive?",
        "keywords": ["mentorship", "onboarding", "code review", "documentation", "feedback", "growth", "empowerment"]
    }
]

TOPICS = [
    "System Design",
    "Algorithms",
    "Web & Distributed",
    "DevOps & Cloud",
    "Behavioral"
]

def get_all_topics():
    return TOPICS

def get_questions_by_topic(topic=None):
    if not topic or topic == "All":
        return QUESTION_BANK
    return [q for q in QUESTION_BANK if q["topic"].lower() == topic.lower()]

def get_random_question(topic=None):
    import random
    questions = get_questions_by_topic(topic)
    return random.choice(questions) if questions else QUESTION_BANK[0]

def search_questions(query="", topic=None):
    results = get_questions_by_topic(topic)
    if not query or not query.strip():
        return results
    q_lower = query.lower()
    return [
        q for q in results
        if q_lower in q["question"].lower()
        or any(q_lower in kw.lower() for kw in q.get("keywords", []))
    ]
