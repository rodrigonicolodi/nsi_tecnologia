document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("graficoValoresCaixas");
  if (!canvas || !window.labelsCaixas || !window.valoresCaixas) return;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: window.labelsCaixas,
      datasets: [
        {
          label: "Saldo Atual",
          data: window.valoresCaixas,
          backgroundColor: [
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
          ],
          borderColor: "rgba(255, 255, 255, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: function (context) {
              const valor = context.raw.toFixed(2);
              return `${context.label}: R$ ${valor}`;
            },
          },
        },
      },
    },
  });
});