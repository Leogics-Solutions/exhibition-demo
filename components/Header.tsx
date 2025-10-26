interface HeaderProps {
  onClearChat: () => void;
}

export default function Header({ onClearChat }: HeaderProps) {
  return (
    <header style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '16px',
      background: 'transparent',
      zIndex: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h1 style={{
        color: 'black',
        fontWeight: 'bold',
        fontSize: 32,
        background: 'white',
        borderRadius: '40px',
        padding: '8px 24px',
        display: 'inline-block',
        margin: 0
      }}>
        Scamurai
      </h1>
      <button
        onClick={onClearChat}
        style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
          background: 'black',
          borderRadius: '24px',
          padding: '8px 24px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Clear Chat
      </button>
    </header>
  );
}
