const API_URL = "http://localhost:5000/api";

export const registerUser = async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Registration failed");
    }

    return response.json();
};

export const loginUser = async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response.text(); // or response.json() depending on backend
        throw new Error(error || "Login failed");
    }

    return response.json();
};

export const verifyToken = async (token) => {
    const response = await fetch(`${API_URL}/auth/is-verify`, {
        method: "GET",
        headers: {
            token: token
        }
    });

    if (!response.ok) {
        return false;
    }

    return response.json();
}

// Child APIs
export const getChildren = async (token) => {
    const response = await fetch(`${API_URL}/children`, {
        method: "GET",
        headers: {
            token: token
        }
    });
    if (!response.ok) throw new Error("Failed to fetch children");
    return response.json();
};

export const addChild = async (token, childData) => {
    const response = await fetch(`${API_URL}/children`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            token: token
        },
        body: JSON.stringify(childData)
    });
    if (!response.ok) throw new Error("Failed to add child");
    return response.json();
};

export const getGrowthLogs = async (token, childId) => {
    const response = await fetch(`${API_URL}/children/${childId}/growth`, {
        method: "GET",
        headers: {
            token: token
        }
    });
    if (!response.ok) throw new Error("Failed to fetch growth logs");
    return response.json();
};

export const addGrowthLog = async (token, childId, logData) => {
    const response = await fetch(`${API_URL}/children/${childId}/growth`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            token: token
        },
        body: JSON.stringify(logData)
    });
    if (!response.ok) throw new Error("Failed to add growth log");
    return response.json();
};

// Activity APIs
export const getActivities = async (token, childId) => {
    const response = await fetch(`${API_URL}/activities/${childId}`, {
        method: "GET",
        headers: {
            token: token
        }
    });
    if (!response.ok) throw new Error("Failed to fetch activities");
    return response.json();
};

export const addActivity = async (token, childId, activityData) => {
    const response = await fetch(`${API_URL}/activities/${childId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            token: token
        },
        body: JSON.stringify(activityData)
    });
    if (!response.ok) throw new Error("Failed to add activity");
    return response.json();
};
// --- Mentor & Session API ---

export const getMentors = async (token) => {
    const response = await fetch(`${API_URL}/mentor/list`, {
        headers: { token }
    });
    return response.json();
};

export const connectMentor = async (token, mentor_id) => {
    const response = await fetch(`${API_URL}/mentor/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ mentor_id })
    });
    return response.json();
};

export const getMyMentor = async (token) => {
    const response = await fetch(`${API_URL}/mentor/my-mentor`, {
        headers: { token }
    });
    return response.json();
};

export const getMyClients = async (token) => {
    const response = await fetch(`${API_URL}/mentor/my-clients`, {
        headers: { token }
    });
    return response.json();
};

// Sessions
export const createSession = async (token, sessionData) => {
    const response = await fetch(`${API_URL}/mentor/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify(sessionData)
    });
    return response.json();
};

export const getSessions = async (token) => {
    const response = await fetch(`${API_URL}/mentor/sessions`, {
        headers: { token }
    });
    return response.json();
};

// --- Resources API ---
export const getResources = async (token, category) => {
    let url = `${API_URL}/resources`;
    if (category) url += `?category=${category}`;

    const response = await fetch(url, {
        headers: { token }
    });
    return response.json();
};

export const createResource = async (token, resourceData) => {
    const response = await fetch(`${API_URL}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify(resourceData)
    });
    return response.json();
};

export const deleteResource = async (token, id) => {
    const response = await fetch(`${API_URL}/resources/${id}`, {
        method: "DELETE",
        headers: { token }
    });
    return response.json();
};

// --- Community API ---
export const getPosts = async (token, category) => {
    let url = `${API_URL}/community/posts`;
    if (category && category !== 'All Posts') url += `?category=${category}`;

    const response = await fetch(url, {
        headers: { token }
    });
    return response.json();
};

export const createPost = async (token, postData) => {
    const response = await fetch(`${API_URL}/community/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify(postData)
    });
    return response.json();
};

export const likePost = async (token, postId) => {
    const response = await fetch(`${API_URL}/community/posts/${postId}/like`, {
        method: "PUT",
        headers: { token }
    });
    return response.json();
};

export const getComments = async (token, postId) => {
    const response = await fetch(`${API_URL}/community/posts/${postId}/comments`, {
        headers: { token }
    });
    return response.json();
};

export const addComment = async (token, postId, content) => {
    const response = await fetch(`${API_URL}/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ content })
    });
    return response.json();
};
