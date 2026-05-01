export function Toasts({ items }) {
  return (
    <div className="toast-container">
      {items.map((item) => (
        <div className={`toast ${item.kind}`} key={item.id}>
          {item.message}
        </div>
      ))}
    </div>
  );
}
