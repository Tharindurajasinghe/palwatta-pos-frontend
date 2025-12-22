export const getBillHTML = (bill) => {
  const date = new Date(bill.date).toLocaleDateString('en-CA');
  

  return `
  <html>
    <head>
      <title>Bill ${bill.billId}</title>
      <style>
        @media print {
          @page { size: 55mm auto; margin: 0; }
        }
        body {
          font-family: 'Courier New', monospace;
          width: 190px;
          margin: 0 auto;
          padding: 5px;
          font-size: 10px;
        }
        .header { text-align: center; }
        .separator { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { font-size: 11px; padding: 4px 0; }
        th { border-bottom: 1px solid #000; }
        .right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Jagath Store</h2>
        <p>Pasal Mawatha, Okkampitiya</p>
        <p>Tel: 0713364743</p>
      </div>

      <p><b>Bill ID – ${bill.billId.padStart(6, '0')}</b></p>
      <p>${date.replace(/-/g, '.')} | ${bill.time}</p>

      <div class="separator"></div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Qty</th>
            <th class="right">Price</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map(i => `
            <tr>
              <td>${i.name}</td>
              <td>${i.quantity}</td>
              <td class="right">${i.price.toFixed(2)}</td>
              <td class="right">${i.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="separator"></div>

      <p><b>Total: ${bill.totalAmount.toFixed(2)}/=</b></p>

      <p style="text-align:center"><b>Thank You..!</b></p>

      <script>
        window.onload = () => {
          window.print();
          window.onafterprint = () => window.close();
        };
      </script>
    </body>
  </html>
  `;
};
