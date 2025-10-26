import cron from 'node-cron';
import { app } from '../lib/config.js';
import { runReminderJob, runCutoffJob } from './cutService.js';

if (app.isScheduler) {
    cron.schedule('0 8 * * *', async () => {
        try { console.log('[ReminderJob]', await runReminderJob()); }
        catch (e) { console.error('[ReminderJob][ERROR]', e); }
    }, { timezone: app.timezone });

    cron.schedule('0 * * * *', async () => {
        try { console.log('[CutoffJob]', await runCutoffJob()); }
        catch (e) { console.error('[CutoffJob][ERROR]', e); }
    }, { timezone: app.timezone });

    console.log(`[Scheduler] Activado. TZ=${app.timezone}`);
} else {
    console.log('[Scheduler] Desactivado en esta máquina.');
}
