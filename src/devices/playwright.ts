// A browser page as a baton Device. Used by evals; the macOS helper is the laptop equivalent.
import type { CDPSession, Page } from 'playwright';
import type { Device } from '../hand.ts';
import { axCandidates, type Candidate, cdp, center, playwrightScreen } from '../perceive.ts';

export async function playwrightDevice(page: Page): Promise<Device> {
  const session: CDPSession = await cdp(page);
  return {
    ...playwrightScreen(page),
    candidates: () => axCandidates(page, session),
    click: async (p) => {
      await page.mouse.click(p.x, p.y);
    },
    typeInto: async (c: Candidate, text: string) => {
      const p = center(c);
      await page.mouse.click(p.x, p.y);
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type(text);
    },
    setValue: async (c: Candidate, value: string) => {
      const { object } = (await session.send('DOM.resolveNode', { backendNodeId: c.backendNodeId })) as any;
      const r = (await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function(v){
          const want = String(v).trim().toLowerCase();
          if (this.tagName === 'SELECT') {
            const o = [...this.options].find((o) => o.text.trim().toLowerCase() === want || o.value.toLowerCase() === want);
            if (!o) return false;
            this.value = o.value;
          } else { this.value = v; }
          this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }`,
        arguments: [{ value }],
        returnByValue: true,
      })) as any;
      return r.result.value === true;
    },
    settle: () => page.waitForTimeout(150),
  };
}
