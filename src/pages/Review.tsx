/**
 * Flashcard review session driven by the Leitner scheduler.
 * The queue is captured once at session start (useState initializer) so grading a
 * card, which moves its due date, doesn't reshuffle the session under the user.
 * Keyboard: Space/Enter reveals, 1 = missed, 2 = got it.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LESSON_BY_ID } from '@/data/lessons';
import { useReview } from '@/stores/reviewStore';
import { useSettings } from '@/stores/settingsStore';
import { dueQueue } from '@/engine/leitner';
import { Button, EmptyState, PageHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { speak, speechSupported, stopSpeaking } from '@/lib/speech';
import { formatRelativeDay } from '@/lib/util';

export default function Review() {
  const grade = useReview((s) => s.grade);
  const sessionSize = useSettings((s) => s.sessionSize);
  const [queue] = useState(() => dueQueue(Object.values(useReview.getState().cards)).slice(0, sessionSize).map((c) => c.lessonId));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const done = index >= queue.length;
  const lesson = done ? undefined : LESSON_BY_ID[queue[index]];

  const answer = (correct: boolean) => {
    if (!lesson) return;
    grade(lesson.id, correct);
    if (correct) setCorrectCount((n) => n + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
    stopSpeaking();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        // Let a focused button handle its own activation.
        if (t.tagName === 'BUTTON') return;
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && e.key === '1') answer(false);
      else if (revealed && e.key === '2') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => stopSpeaking, []);

  if (queue.length === 0) {
    return (
      <>
        <PageHeader title="Review" />
        <EmptyState
          title="You're all caught up"
          body="No cards are due. Come back tomorrow, or revisit the lessons to refresh your memory."
          action={
            <Link to="/learn">
              <Button variant="primary">Back to lessons</Button>
            </Link>
          }
        />
      </>
    );
  }

  if (done) {
    const cards = useReview.getState().cards;
    const next = Object.values(cards).map((c) => c.dueAt).sort()[0];
    return (
      <>
        <PageHeader title="Session complete" />
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-md space-y-3 p-8 text-center">
          <p className="text-4xl font-semibold tabular-nums">
            {correctCount}/{queue.length}
          </p>
          <p className="text-sm text-muted">
            {correctCount === queue.length ? 'Perfect run. Those cards move up a box.' : 'Missed cards come back tomorrow so they stick.'}
          </p>
          {next && <p className="text-xs text-muted">Next card due {formatRelativeDay(next)}.</p>}
          <Link to="/learn" className="inline-block pt-2">
            <Button variant="primary">Back to lessons</Button>
          </Link>
        </motion.div>
      </>
    );
  }

  const pct = (index / queue.length) * 100;

  return (
    <>
      <PageHeader title="Review" subtitle={`Card ${index + 1} of ${queue.length}`} />
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={queue.length}
        aria-valuenow={index}
        aria-label="Session progress"
        className="mb-6 h-1.5 overflow-hidden rounded-full bg-raised"
      >
        <motion.div className="h-full bg-accent" initial={false} animate={{ width: `${pct}%` }} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={lesson!.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
          aria-live="polite"
          className="card mx-auto max-w-xl space-y-5 p-6 sm:p-8"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{lesson!.title}</p>
          <h2 className="text-lg font-semibold leading-snug sm:text-xl">{lesson!.card.question}</h2>

          {revealed ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-accent/10 p-4 text-[15px] leading-relaxed">
              {lesson!.card.answer}
            </motion.p>
          ) : (
            <p className="text-sm text-muted">Say your answer out loud or in your head, then reveal.</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!revealed ? (
              <Button variant="primary" onClick={() => setRevealed(true)}>
                Show answer
              </Button>
            ) : (
              <>
                <Button variant="danger" onClick={() => answer(false)}>
                  <Icon name="x" size={16} /> Missed it <kbd className="ml-1 text-xs opacity-60">1</kbd>
                </Button>
                <Button variant="primary" onClick={() => answer(true)}>
                  <Icon name="check" size={16} /> Got it <kbd className="ml-1 text-xs opacity-70">2</kbd>
                </Button>
              </>
            )}
            {speechSupported && (
              <Button variant="ghost" className="ml-auto" aria-label="Read aloud" onClick={() => speak(revealed ? `${lesson!.card.question} ${lesson!.card.answer}` : lesson!.card.question)}>
                <Icon name="volume" size={16} />
              </Button>
            )}
          </div>
        </motion.article>
      </AnimatePresence>
    </>
  );
}
