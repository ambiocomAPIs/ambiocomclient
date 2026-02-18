// ExcelUploadButton.jsx
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const ExcelUploadButton = forwardRef(
  (
    {
      url,
      onSuccess,
      accept = ".xlsx,.xls",
      maxErrorExamples = 8,
      title = "Carga masiva desde Excel",
    },
    ref
  ) => {
    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
      open: () => inputRef.current?.click(),
      clear: () => {
        if (inputRef.current) inputRef.current.value = "";
      },
    }));

    const validateFile = (file) => {
      if (!file) return { ok: false, msg: "No se seleccionó archivo." };
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!["xlsx", "xls"].includes(ext)) {
        return { ok: false, msg: "Solo se permiten archivos Excel (.xlsx, .xls)." };
      }
      return { ok: true };
    };

    const buildResultHtml = ({ insertados, errores }) => {
      const totalErrores = errores?.length || 0;

      if (totalErrores === 0) {
        return `
          <div style="text-align:left">
            <div><b>Insertados:</b> ${insertados ?? 0}</div>
            <div><b>Errores:</b> 0</div>
          </div>
        `;
      }

      const ejemplos = (errores || [])
        .slice(0, maxErrorExamples)
        .map((e) => `• <b>Fila ${e.filaExcel}</b>: ${e.error}`)
        .join("<br/>");

      return `
        <div style="text-align:left">
          <div><b>Insertados:</b> ${insertados ?? 0}</div>
          <div><b>Errores:</b> ${totalErrores}</div>
          <hr style="margin:10px 0" />
          <div><b>Ejemplos:</b></div>
          <div style="margin-top:6px">${ejemplos}</div>
          ${
            totalErrores > maxErrorExamples
              ? `<div style="margin-top:10px; opacity:.8">(+${totalErrores - maxErrorExamples} más)</div>`
              : ""
          }
        </div>
      `;
    };

    // ===== Loading PRO: barra animada + estados =====
    const showProLoading = (file) => {
      Swal.fire({
        title: "Procesando carga masiva",
        html: `
          <div style="text-align:left; margin-top:10px">
            <div style="margin-bottom:8px">
              📁 <b>Archivo:</b> ${file.name}
            </div>

            <div style="
              height: 8px;
              width: 100%;
              background: #e0e0e0;
              border-radius: 6px;
              overflow: hidden;
              margin-top: 12px;
            ">
              <div id="progress-bar" style="
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #1976d2, #42a5f5);
                transition: width 0.4s ease;
              "></div>
            </div>

            <div id="progress-text" style="margin-top:10px; font-size:13px; opacity:0.8">
              Iniciando...
            </div>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          const bar = document.getElementById("progress-bar");
          const text = document.getElementById("progress-text");

          let progress = 0;

          const interval = setInterval(() => {
            progress += 15;
            if (progress > 90) progress = 90;

            if (bar) bar.style.width = progress + "%";

            if (text) {
              if (progress < 30) text.innerText = "Subiendo archivo...";
              else if (progress < 60) text.innerText = "Validando datos...";
              else text.innerText = "Insertando registros...";
            }
          }, 500);

          // guardamos el interval para poder limpiarlo luego
          Swal.__excelInterval = interval;
        },
      });
    };

    const closeProLoading = async () => {
      try {
        // limpia interval
        if (Swal.__excelInterval) {
          clearInterval(Swal.__excelInterval);
          Swal.__excelInterval = null;
        }

        // completa barra si existe (por si sigue abierto)
        const bar = document.getElementById("progress-bar");
        const text = document.getElementById("progress-text");
        if (bar) bar.style.width = "100%";
        if (text) text.innerText = "Finalizando...";

        // pequeño delay para que se vea el 100%
        await new Promise((r) => setTimeout(r, 350));
      } finally {
        Swal.close();
      }
    };

    const handleChange = async (e) => {
      const file = e.target.files?.[0];
      const v = validateFile(file);

      if (!v.ok) {
        await Swal.fire({ icon: "error", title: "Archivo inválido", text: v.msg });
        e.target.value = "";
        return;
      }

      // Mostrar loading PRO
      showProLoading(file);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axios.post(url, formData);

        await closeProLoading();

        const errores = res.data?.errores || [];
        const totalErrores = errores.length;

        // Resultado PRO con opción de ver detalle completo
        await Swal.fire({
          icon: totalErrores ? "warning" : "success",
          title: totalErrores ? "Carga finalizada con errores" : "Carga exitosa",
          html: buildResultHtml({
            insertados: res.data?.insertados,
            errores,
          }),
          confirmButtonText: "Aceptar",
          showCancelButton: totalErrores > 0,
          cancelButtonText: "Ver detalle completo",
          width: 650,
        }).then(async (r) => {
          if (r.dismiss === Swal.DismissReason.cancel && totalErrores > 0) {
            const detalle = errores
              .map((x) => `Fila ${x.filaExcel}: ${x.error}`)
              .join("\n");

            await Swal.fire({
              icon: "info",
              title: "Detalle de errores",
              html: `<pre style="text-align:left; white-space:pre-wrap; max-height:320px; overflow:auto; margin:0">${detalle}</pre>`,
              confirmButtonText: "Cerrar",
              width: 750,
            });
          }
        });

        onSuccess?.(res.data);
      } catch (error) {
        await closeProLoading();

        console.error("❌ Error cargando Excel:", error);

        const msg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Error subiendo el Excel. Revisa la consola.";

        await Swal.fire({
          icon: "error",
          title: "Error en carga masiva",
          text: msg,
        });
      } finally {
        // permite volver a subir el mismo archivo
        e.target.value = "";
      }
    };

    return (
      <input
        ref={inputRef}
        id="excelUpload"
        type="file"
        accept={accept}
        hidden
        onChange={handleChange}
      />
    );
  }
);

export default ExcelUploadButton;
