const parquet = require('parquetjs');
const fs = require('fs');
const path = require('path');

async function readParquetFile(filePath) {
  try {
    console.log(`Reading parquet file: ${filePath}`);
    
    // Read the parquet file
    const reader = await parquet.ParquetReader.openFile(filePath);
    const cursor = reader.getCursor();
    
    // Get schema information
    const schema = reader.getSchema();
    console.log('\n📊 Schema Information:');
    console.log('Fields:', schema.fieldList.map(f => f.name).join(', '));
    console.log(`Total rows: ${reader.getRowCount()}\n`);
    
    // Read all rows
    const rows = [];
    let row;
    let count = 0;
    
    while (row = await cursor.next()) {
      rows.push(row);
      count++;
      
      // Show first few rows as preview
      if (count <= 5) {
        console.log(`Row ${count}:`, JSON.stringify(row, null, 2));
      }
    }
    
    await reader.close();
    
    console.log(`\n✅ Successfully read ${rows.length} rows from parquet file\n`);
    
    return { rows, schema };
  } catch (error) {
    console.error('❌ Error reading parquet file:', error);
    throw error;
  }
}

function convertToCSV(rows, outputPath) {
  try {
    if (rows.length === 0) {
      console.log('⚠️  No rows to convert');
      return;
    }
    
    // Get all column names from the first row
    const columns = Object.keys(rows[0]);
    
    // Create CSV header
    const header = columns.join(',');
    
    // Create CSV rows
    const csvRows = rows.map(row => {
      return columns.map(col => {
        const value = row[col];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });
    
    // Combine header and rows
    const csvContent = [header, ...csvRows].join('\n');
    
    // Write to file
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`✅ Successfully converted to CSV: ${outputPath}`);
    console.log(`   Total rows: ${rows.length}`);
    console.log(`   Total columns: ${columns.length}`);
  } catch (error) {
    console.error('❌ Error converting to CSV:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0] || 'instrument_master_2025-12-04 1.parquet';
  const outputPath = args[1] || 'instrument_master_2025-12-04.csv';
  const convertOnly = args.includes('--convert-only');
  const readOnly = args.includes('--read-only');
  
  // Resolve file paths relative to project root
  const projectRoot = path.resolve(__dirname, '..');
  const fullFilePath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
  const fullOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(projectRoot, outputPath);
  
  if (!fs.existsSync(fullFilePath)) {
    console.error(`❌ File not found: ${fullFilePath}`);
    process.exit(1);
  }
  
  try {
    const { rows, schema } = await readParquetFile(fullFilePath);
    
    if (!readOnly) {
      console.log('\n🔄 Converting to CSV...');
      convertToCSV(rows, fullOutputPath);
    } else {
      console.log('\n📋 Read-only mode: CSV conversion skipped');
    }
    
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();


