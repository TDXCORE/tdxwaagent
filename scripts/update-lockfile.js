#!/usr/bin/env node

/**
 * Este script actualiza el archivo de bloqueo (yarn.lock) para reflejar las dependencias
 * actuales en package.json. Debe ejecutarse después de modificar package.json.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Actualizando archivo de bloqueo...');

try {
  // Verificar si estamos usando yarn
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const isYarn = packageJson.packageManager && packageJson.packageManager.startsWith('yarn');
  
  if (isYarn) {
    console.log('Usando Yarn para actualizar el archivo de bloqueo...');
    execSync('yarn install', { stdio: 'inherit' });
  } else {
    console.log('Usando npm para actualizar el archivo de bloqueo...');
    execSync('npm install', { stdio: 'inherit' });
  }
  
  console.log('Archivo de bloqueo actualizado correctamente.');
} catch (error) {
  console.error('Error al actualizar el archivo de bloqueo:', error);
  process.exit(1);
}