export const exportToCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => {
      // Escape quotes and wrap in quotes for safety
      const cleanVal = String(val).replace(/"/g, '""');
      return `"${cleanVal}"`;
    }).join(','))
  ].join('\n');

  // \ufeff is the Byte Order Mark (BOM) for UTF-8 which forces Excel to recognize characters correctly
  const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};