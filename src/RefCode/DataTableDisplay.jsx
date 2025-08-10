import React, { useEffect, useState } from "react";
import { API_BASE } from "../services/apiBase";
import { statEngines } from "../services/statMeasureEngines";
import { generateClassData } from "../services/dataGenerators";
import ValidatedInputTable from "../components/ValidatedInputTable";

/**
 * 📋 Displays editable table for xi and fi columns.
 * Can handle both grouped and ungrouped data formats.
 */
export default function DataTableDisplay({ code, studentId = "demo-student" }) {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    async function fetchDataTable() {
      try {
        const res = await fetch(`${API_BASE}/exercises/by-code/${code}`);
        const data = await res.json();

        const engine = statEngines[data.statMeasure];
        const generated = generateClassData(data.dataGeneration);

        const xi = data.configData?.classIntervals ?? generated.xi;
        const fi = data.configData?.frequencies ?? generated.fi;

        const rawRows = engine.generateInitialRows?.(xi, fi) ?? [];

        const labeledRows = rawRows.map((row, i) => ({
          ...row,
          ciLabel: Array.isArray(xi[i])
            ? `${xi[i][0]}–${xi[i][1]}`
            : String(xi[i]), // handle ungrouped
        }));

        setRows(labeledRows);
        setColumns(engine.tableConfig?.columns ?? []);
      } catch (err) {
        console.error("❌ Failed to load data table:", err);
      }
    }

    if (code) fetchDataTable();
  }, [code]);

  return (
    <div className="data-table-section">
      <ValidatedInputTable columns={columns} data={rows} setData={setRows} />
    </div>
  );
}
