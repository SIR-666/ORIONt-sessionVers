import * as XLSX from "xlsx";

// export into xlsx format
const onGetExportProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://fakestoreapi.com/products'); // ganti ke url getStoppages
      // Check if the action result contains data and if it's an array
      if (products && Array.isArray(products)) {
        const dataToExport = products.map((pro) => ({
          title: pro.title,
          price: pro.lastname,
          category: pro.category,
          description: pro.description,
        })
          ,);
        // Create Excel workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils?.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(workbook, worksheet, worksheetname);
        // Save the workbook as an Excel file
        XLSX.writeFile(workbook, `${title}.xlsx`);
        console.log(`Exported data to ${title}.xlsx`);
        setLoading(false);
      } else {
        setLoading(false);
        console.log("#==================Export Error")
      }
    } catch (error) {
      setLoading(false);
      console.log("#==================Export Error", error.message);

    }
};

export default onGetExportProduct();