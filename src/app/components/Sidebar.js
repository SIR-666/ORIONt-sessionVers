import {
  BookTextIcon,
  CircleGaugeIcon,
  CircleXIcon,
  ClipboardListIcon,
  HouseIcon,
  ShieldCheckIcon,
  Table2Icon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import QualityLoss from "./QualLoss";
import Quantity from "./Quantity";
import Speed from "./SpeedLoss";

function SidebarContent({ isOpen }) {
  const searchParams = useSearchParams();
  const value = searchParams.get("value");
  const id = searchParams.get("id");
  const [path, setPath] = useState("");
  const [quantityModal, setQuantityModal] = useState(false);
  const [qualityLossModal, setQualityLossModal] = useState(false);
  const [speedLossModal, setSpeedLossModal] = useState(false);
  const [lineValue, setLineValue] = useState(null);
  const [lineId, setLineId] = useState(null);
  const line = localStorage.getItem("line");
  const shift = localStorage.getItem("shift");
  const date = localStorage.getItem("date");
  const po = localStorage.getItem("selectedMaterial");
  const storedId = localStorage.getItem("id");

  useEffect(() => {
    // Check if we're in the client environment
    if (typeof window !== "undefined") {
      setLineValue(searchParams.get("value") || localStorage.getItem("line"));
      setLineId(searchParams.get("id") || localStorage.getItem("id"));
    }
  }, [searchParams]);

  let ident;
  if (po) {
    const selectedMaterial = JSON.parse(po);

    // Access the id property of the first object in the array
    ident = selectedMaterial[0]?.id;
  } else if (storedId) {
    ident = storedId;
  }

  // console.log("Ident: ", ident);

  const navItems = [
    {
      label: "Home",
      href: `../../main?value=${lineValue}&id=${lineId || ident}`,
      show: !!po || !!storedId,
    },
    {
      label: "Manage Orders",
      action: () => {
        if (line && shift && date) {
          window.location.href = `../../order/filling?value=${line}&shift=${shift}&date=${date}`;
        } else {
          window.location.href = "../../order";
        }
      },
      show: true,
    },
    {
      label: "Manage Downtime",
      href: `../../stoppage?value=${lineValue}&id=${lineId || ident}`,
      //   show: !!po || !!storedId,
      show: true,
    },
    {
      label: "Insert Finished Goods",
      action: () => {
        if (path === "/main") {
          console.log("Opening Insert Finished Goods modal...");
          setQuantityModal(true);
        } else {
          alert("This action is only available on the Home page.");
        }
      },
      show: true,
    },
    {
      label: "Insert Quality Loss",
      action: () => {
        if (path === "/main") {
          console.log("Opening Insert Quality Loss modal...");
          setQualityLossModal(true);
        } else {
          alert("This action is only available on the Home page.");
        }
      },
      show: true,
    },
    {
      label: "Insert Speed Loss",
      action: () => {
        if (path === "/main") {
          console.log("Opening Insert Speed Loss modal...");
          setSpeedLossModal(true);
        } else {
          alert("This action is only available on the Home page.");
        }
      },
      show: true,
    },
    { label: "Downtime Report", href: "../../report", show: true },
    { label: "Performance Report", href: "../../performance", show: true },
  ];

  useEffect(() => {
    setPath(window.location.pathname);
  }, [path]);

  const renderIcon = (label) => {
    switch (label) {
      case "Home":
        return <HouseIcon className="size-4 mr-4" />;
      case "Manage Orders":
        return <BookTextIcon className="size-4 mr-4" />;
      case "Manage Downtime":
        return <CircleXIcon className="size-4 mr-4" />;
      case "Insert Finished Goods":
        return <ClipboardListIcon className="size-4 mr-4" />;
      case "Insert Quality Loss":
        return <ShieldCheckIcon className="size-4 mr-4" />;
      case "Insert Speed Loss":
        return <CircleGaugeIcon className="size-4 mr-4" />;
      case "Downtime Report":
        return <Table2Icon className="size-4 mr-4" />;
      case "Performance Report":
        return <Table2Icon className="size-4 mr-4" />;
      default:
        break;
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-10 ${
        isOpen ? "w-64" : "w-16"
      } transition-width duration-300 flex-col border-r bg-white pt-16`}
    >
      <div
        className={`flex flex-col space-y-4 p-4 ${isOpen ? "block" : "hidden"}`}
      >
        {navItems
          .filter((item) => item.show)
          .map((item, index) => (
            <a
              key={index}
              href={item.href}
              className=" flex items-center w-full block px-4 py-2 text-gray-700 hover:bg-gray-200 rounded"
              onClick={(e) => {
                if (item.action) {
                  e.preventDefault();
                  item.action();
                }
              }}
            >
              {renderIcon(item.label)}
              {item.label}
            </a>
          ))}
      </div>
      {quantityModal && <Quantity onClose={() => setQuantityModal(false)} />}
      {qualityLossModal && (
        <QualityLoss onClose={() => setQualityLossModal(false)} />
      )}
      {speedLossModal && <Speed onClose={() => setSpeedLossModal(false)} />}
    </aside>
  );
}

export default function Sidebar({ isOpen }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SidebarContent isOpen={isOpen} />
    </Suspense>
  );
}
