import { expect, test } from '@playwright/test'

// These smoke tests intentionally stop at "the page renders correctly" — there's
// no test Supabase project/credentials available yet, so we can't exercise a real
// login → authenticated navigation flow in CI. Extend this once that test infra
// exists (tracked as a follow-up, not blocking this initial CI wiring).

test('landing page loads at the domain root', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/apresentacao-diaria-pro\.html/)
  await expect(page.locator('h1')).toContainText('Controle e pague seus diaristas')
})

test('login screen renders with email, password and submit', async ({ page }) => {
  await page.goto('/entrar')
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  await expect(page.getByPlaceholder('seu@email.com')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar no Painel' })).toBeVisible()
})
