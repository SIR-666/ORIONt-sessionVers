const RectangleTable = ({ stoppageData }) => {
  const formatTimeUTC = (date) => {
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const getTimeRange = (date, minutes) => {
    const start = new Date(date);
    const end = new Date(start.getTime() + minutes * 60000);

    return `${formatTimeUTC(start)} - ${formatTimeUTC(end)}`;
  };

  return (
    <div className="relative w-full h-96 rounded-xl bg-white shadow-xl">
      <div className="relative w-full overflow-y-auto flex flex-col h-full px-5 py-4">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-6">
                Machine
              </th>
              <th scope="col" className="py-3 px-6">
                Range Time
              </th>
              <th scope="col" className="py-3 px-6">
                Duration (minute)
              </th>
              <th scope="col" className="py-3 px-6">
                Stoppage Code
              </th>
              <th scope="col" className="py-3 px-6">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {stoppageData.map((item, index) => (
              <tr className="bg-white border-b" key={index}>
                <td className="py-4 px-6">{item.Mesin}</td>
                <td className="py-4 px-6">
                  {getTimeRange(item.Date, item.Minutes)}
                </td>
                <td className="py-4 px-6">{item.Minutes}</td>
                <td className="py-4 px-6">{item.Jenis}</td>
                <td className="py-4 px-6">{item.Keterangan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RectangleTable;
