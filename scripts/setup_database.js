#!/usr/bin/env node

/**
 * Script para configurar la base de datos en Supabase
 * 
 * Este script lee el archivo SQL de creación de tablas y lo ejecuta en Supabase
 * usando la API REST de Supabase.
 * 
 * Uso:
 * 1. Asegúrate de tener las variables de entorno configuradas en .env
 * 2. Ejecuta: node scripts/setup_database.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Verificar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas.');
  process.exit(1);
}

// Crear cliente Supabase con la Service Role Key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Leer el archivo SQL
const sqlFilePath = path.join(__dirname, 'create_database.sql');
let sqlContent;

try {
  sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
} catch (error) {
  console.error(`Error al leer el archivo SQL: ${error.message}`);
  process.exit(1);
}

// Dividir el contenido SQL en declaraciones individuales
// Nota: Esta es una forma simple de dividir; puede no funcionar para todos los casos
const sqlStatements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0)
  .map(stmt => stmt + ';');

// Función para ejecutar una consulta SQL
async function executeQuery(query) {
  try {
    const { error } = await supabase.rpc('pgexecute', { query });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error al ejecutar consulta: ${error.message}`);
    console.error(`Consulta: ${query}`);
    return false;
  }
}

// Ejecutar todas las consultas en secuencia
async function setupDatabase() {
  console.log('Iniciando configuración de la base de datos...');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const stmt = sqlStatements[i];
    process.stdout.write(`Ejecutando consulta ${i + 1}/${sqlStatements.length}... `);
    
    const success = await executeQuery(stmt);
    
    if (success) {
      process.stdout.write('OK\n');
      successCount++;
    } else {
      process.stdout.write('FALLÓ\n');
      failCount++;
    }
  }
  
  console.log('\nResumen:');
  console.log(`- Consultas exitosas: ${successCount}`);
  console.log(`- Consultas fallidas: ${failCount}`);
  
  if (failCount === 0) {
    console.log('\n¡Configuración de la base de datos completada con éxito!');
  } else {
    console.log('\nLa configuración de la base de datos completó con errores.');
    console.log('Revisa los mensajes de error anteriores y corrige los problemas.');
  }
}

// Ejecutar la configuración
setupDatabase().catch(error => {
  console.error(`Error inesperado: ${error.message}`);
  process.exit(1);
});