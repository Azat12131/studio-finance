export default function Schedule({
  onCreate,
}: {
  onCreate: () => void
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">График</h1>

      <button
        onClick={onCreate}
        className="mt-4 bg-blue-600 px-4 py-2 rounded-xl"
      >
        + Новая запись
      </button>
    </div>
  )
}