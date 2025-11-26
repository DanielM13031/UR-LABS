import cron from 'node-cron';
import app from '../../config/app.js';
import { runReminderJob, runCutoffJob } from './cutService.js';

const REMINDER_CRON = '0 8 * * *';

const CUTOFF_CHECK_CRON = '0 * * * *';

if (app?.isScheduler) {
    cron.schedule(REMINDER_CRON, async () => {
    try {
        const res = await runReminderJob();
        console.log('[ReminderJob]', res);
    } catch (e) {
        console.error('[ReminderJob][ERROR]', e);
    }
    }, { timezone: app.timezone || 'America/Bogota' });

    cron.schedule(CUTOFF_CHECK_CRON, async () => {
        try {
            const res = await runCutoffJob();
            console.log('[CutoffJob]', res);
        } catch (e) {
        console.error('[CutoffJob][ERROR]', e);
        }
    }, { timezone: app.timezone || 'America/Bogota' });

    console.log(`[Scheduler] Activado. TZ=${app.timezone || 'America/Bogota'}`);
} else {
    console.log('[Scheduler] Desactivado en esta máquina.');
}
