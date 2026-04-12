import { test, expect } from '@playwright/test';

test('El frontend carga la página de inicio correctamente', async ({ page }) => {
  // Navega a la URL local de Angular
  await page.goto('http://localhost:4200/');

  // Verifica que el título de la página tenga que ver con "Ascensores"
  await expect(page).toHaveTitle(/Ascensores|JMG/i);
});
