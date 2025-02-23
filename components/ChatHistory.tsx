export default function ChatHistory() {
  // This is just a placeholder. In a real application, you'd fetch the actual chat history.
  const chatHistory = [
    { id: 1, title: "Chat 1" },
    { id: 2, title: "Chat 2" },
    { id: 3, title: "Chat 3" },
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Chat History</h2>
      <ul>
        {chatHistory.map((chat) => (
          <li key={chat.id} className="mb-2">
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">
              {chat.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
