const XLSX = require('xlsx');

// Create a sample data with exact column names
const data = [
  {
    'País': 'Colombia',
    'Host': 'SRV-COL-001',
    'Nombre VM': 'VM-WEB-01',
    'IP': '192.168.1.10',
    'CPU': 4,
    'Memoria': '16GB',
    'Disco': '500GB SSD',
    'Ambiente': 'Produccion',
    'Arquitectura': 'x86_64',
    'Sistema Operativo': 'Windows Server 2019',
    'Versión O.S': '1809',
    'Antivirus': 'Windows Defender',
    'Estado': 'Activo',
    'Responsable': 'Juan Pérez'
  }
];

// Create workbook
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(data);

// Write to file
XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
XLSX.writeFile(workbook, 'plantilla_importacion.xlsx');

console.log('Plantilla creada: plantilla_importacion.xlsx');
