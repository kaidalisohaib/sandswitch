// Mock users data
export const users = [
  {
    id: "user1",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    profilePic: "/avatars/avatar1.png",
    joinedDate: "2023-09-15",
    rating: 4.8,
    completedServices: 12,
  },
  {
    id: "user2",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    profilePic: "/avatars/avatar2.png",
    joinedDate: "2023-08-22",
    rating: 4.5,
    completedServices: 7,
  },
  {
    id: "user3",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    profilePic: "/avatars/avatar3.png",
    joinedDate: "2023-10-05",
    rating: 4.9,
    completedServices: 18,
  },
  {
    id: "user4",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    profilePic: "/avatars/avatar4.png",
    joinedDate: "2023-07-30",
    rating: 4.2,
    completedServices: 5,
  },
];

// Mock services data
export const services = [
  {
    id: "service1",
    type: "offering", // "offering" or "request"
    title: "Homemade Sandwich Delivery",
    description:
      "Offering to make and deliver fresh sandwiches to campus. Can do vegetarian and vegan options too!",
    category: "Food",
    tags: ["sandwich", "lunch", "delivery"],
    userId: "user1",
    created: "2023-11-10T14:30:00Z",
    status: "active", // active, matched, completed
    location: "Main Campus",
  },
  {
    id: "service2",
    type: "request",
    title: "Need Help with Math Assignment",
    description:
      "Looking for someone to help explain calculus concepts for my upcoming assignment.",
    category: "Academic",
    tags: ["tutoring", "math", "calculus"],
    userId: "user2",
    created: "2023-11-09T10:15:00Z",
    status: "active",
    location: "Library or Online",
  },
  {
    id: "service3",
    type: "offering",
    title: "Guitar Lessons for Beginners",
    description:
      "Happy to teach basic guitar skills. I can bring my extra guitar if you don't have one.",
    category: "Music",
    tags: ["guitar", "lessons", "music"],
    userId: "user3",
    created: "2023-11-08T16:45:00Z",
    status: "active",
    location: "Music Room or Outdoor Space",
  },
  {
    id: "service4",
    type: "request",
    title: "Need a Coffee Buddy",
    description:
      "Looking for someone to grab coffee with and discuss philosophy books. I'll buy the coffee!",
    category: "Social",
    tags: ["coffee", "conversation", "philosophy"],
    userId: "user4",
    created: "2023-11-11T09:20:00Z",
    status: "active",
    location: "Campus Café",
  },
  {
    id: "service5",
    type: "offering",
    title: "Photography for Student Events",
    description:
      "Can take professional-quality photos for your student club events or personal projects.",
    category: "Creative",
    tags: ["photography", "events", "portfolio"],
    userId: "user3",
    created: "2023-11-07T13:10:00Z",
    status: "matched",
    location: "Anywhere on Campus",
  },
  {
    id: "service6",
    type: "request",
    title: "Need Sandwich for Lunch Tomorrow",
    description:
      "Would appreciate if someone could bring me a sandwich tomorrow. Any kind works!",
    category: "Food",
    tags: ["sandwich", "lunch", "food"],
    userId: "user2",
    created: "2023-11-10T18:30:00Z",
    status: "active",
    location: "Student Center",
  },
];

// Mock matches data with users and services
export const matches = [
  {
    id: "match1",
    serviceId: "service5",
    requesterId: "user4",
    providerId: "user3",
    status: "in-progress",
    created: "2023-11-08T14:25:00Z",
    lastUpdated: "2023-11-09T10:00:00Z",
    communicationPreference: "in-app",
    requesterStarted: true,
    providerStarted: true,
    requesterCompleted: false,
    providerCompleted: false,
    messages: [
      {
        id: "msg1",
        senderId: "user4",
        content:
          "Hi! I'm interested in your photography offer for our club's event next week.",
        timestamp: "2023-11-08T14:30:00Z",
        read: true,
      },
      {
        id: "msg2",
        senderId: "user3",
        content: "Hey there! I'd be happy to help. What kind of event is it?",
        timestamp: "2023-11-08T15:15:00Z",
        read: true,
      },
      {
        id: "msg3",
        senderId: "user4",
        content:
          "It's a small art showcase in the student center. Would you be available Tuesday around 6pm?",
        timestamp: "2023-11-09T09:45:00Z",
        read: true,
      },
    ],
  },
  {
    id: "match2",
    serviceId: "service2",
    requesterId: "user2",
    providerId: "user1",
    status: "wanted",
    created: "2023-11-09T16:20:00Z",
    lastUpdated: "2023-11-09T16:20:00Z",
    communicationPreference: "in-app", // Changed from "mio" to "in-app"
    requesterStarted: false,
    providerStarted: false,
    requesterCompleted: false,
    providerCompleted: false,
    messages: [
      {
        id: "msg_initial",
        senderId: "user2",
        content:
          "Hello! I could really use your help with my calculus assignment. When would you be available?",
        timestamp: "2023-11-09T16:25:00Z",
        read: false,
      },
    ],
  },
  {
    id: "match3",
    serviceId: "service1",
    requesterId: "user4",
    providerId: "user1",
    status: "wanted",
    created: "2023-11-10T09:15:00Z",
    lastUpdated: "2023-11-10T09:15:00Z",
    communicationPreference: "in-app",
    requesterStarted: false,
    providerStarted: false,
    requesterCompleted: false,
    providerCompleted: false,
    messages: [
      {
        id: "msg_sandwich1",
        senderId: "user4",
        content:
          "Hi Jane! I'd love to order one of your sandwiches. Do you have any vegetarian options?",
        timestamp: "2023-11-10T09:20:00Z",
        read: false,
      },
    ],
  },
  {
    id: "match7",
    serviceId: "service1",
    requesterId: "user2",
    providerId: "user1",
    status: "wanted",
    created: "2024-11-10T09:15:00Z",
    lastUpdated: "2024-11-10T09:15:00Z",
    communicationPreference: "in-app",
    requesterStarted: false,
    providerStarted: false,
    requesterCompleted: false,
    providerCompleted: false,
    messages: [
      {
        id: "msg_sandwich1",
        senderId: "user2",
        content:
          "Hi Soka! I'd love to order one of your sandwiches. Do you have any vegetarian options?",
        timestamp: "2024-11-10T09:20:00Z",
        read: false,
      },
    ],
  },
  {
    id: "match4",
    serviceId: "service6",
    requesterId: "user2",
    providerId: "user3",
    status: "in-progress",
    created: "2023-11-10T19:45:00Z",
    lastUpdated: "2023-11-11T08:30:00Z",
    communicationPreference: "in-app",
    requesterStarted: true,
    providerStarted: true,
    requesterCompleted: false,
    providerCompleted: true,
    messages: [
      {
        id: "msg_sandwich_req1",
        senderId: "user3",
        content:
          "Hey Alex, I can bring you a sandwich tomorrow. Any preferences?",
        timestamp: "2023-11-10T19:50:00Z",
        read: true,
      },
      {
        id: "msg_sandwich_req2",
        senderId: "user2",
        content:
          "That would be awesome! I like turkey or chicken if you have it. Thank you!",
        timestamp: "2023-11-10T20:15:00Z",
        read: true,
      },
      {
        id: "msg_sandwich_req3",
        senderId: "user3",
        content:
          "No problem! I'll bring a turkey sandwich. See you at the Student Center around noon?",
        timestamp: "2023-11-11T08:30:00Z",
        read: false,
      },
    ],
  },
];

// Mock categories for services
export const categories = [
  "Food",
  "Academic",
  "Creative",
  "Social",
  "Technology",
  "Music",
  "Sports",
  "Transportation",
  "Miscellaneous",
];

// Mock popular tags
export const popularTags = [
  "sandwich",
  "tutoring",
  "coffee",
  "ride",
  "notes",
  "study",
  "music",
  "programming",
  "art",
  "exercise",
];
