import { useEffect, useState } from "react";
import url from "../url";

const HistoryFinishGoodTable = () => {
  const [historyData, setHistoryData] = useState([]);
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plant = sessionStorage.getItem("plant");
        const line = sessionStorage.getItem("line");

        setPlant(plant || "");
        setLine(line || "");

        const queryParams = new URLSearchParams({
          plant: plant || "",
          line: line || "",
        });

        const response = await fetch(
          `${url.URL}/getHistoryFinishGood?${queryParams}`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log(data);
        setHistoryData(data);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    fetchData();
  }, []);

  const showRejectColumns =
    plant !== "Milk Processing" && line !== "PASTEURIZER" ? true : false;

  return (
    <div className="relative w-full rounded-xl bg-white shadow-xl">
      <div className="relative w-full overflow-y-auto flex flex-col h-full px-5 py-4">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-6">
                Date
              </th>
              <th scope="col" className="py-3 px-6">
                Product SKU
              </th>
              <th scope="col" className="py-3 px-6">
                Group
              </th>
              <th scope="col" className="py-3 px-6">
                Quantity
              </th>
              {showRejectColumns && (
                <>
                  <th scope="col" className="py-3 px-6">
                    Reject Filling
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Reject Packing
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Sample
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {historyData.map((item, index) => (
              <tr className="bg-white border-b" key={index}>
                <td className="py-4 px-6">{item.tanggal}</td>
                <td className="py-4 px-6">{item.productSku}</td>
                <td className="py-4 px-6">{item.group}</td>
                <td className="py-4 px-6">{item.quantity}</td>
                {showRejectColumns && (
                  <>
                    <td className="py-4 px-6">{item.rejectFilling}</td>
                    <td className="py-4 px-6">{item.rejectPacking}</td>
                    <td className="py-4 px-6">{item.sample}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryFinishGoodTable;
