export default function Player({ stream }: { stream: string | undefined }) {
  return (
    <div>
      <video src={stream} controls className="h-96"></video>
      <div className="mt-3">
        <h1 className="text-xl font-semibold">Gameplay of Spiderman 2!</h1>
      </div>
    </div>
  );
}
