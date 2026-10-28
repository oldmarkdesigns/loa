import { cn } from "cn";

const enterClass = "animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-backwards";
const enterDelay = (index) => ({ animationDelay: `${index * 70}ms` });

/**
 * One screen of the publish overlay: question, description, the answer itself, then the actions.
 * Each part fades in slightly after the one above it. While `advancing` the whole stage lifts away
 * and goes inert, leaving the orb alone on the canvas.
 */
export default function PublishStage({ question, helper, children, actions, advancing = false, groupRef, headingRef, onFieldsKeyDown }) {
  return (
    <div
      ref={groupRef}
      role="group"
      aria-labelledby="publish-question"
      aria-describedby="publish-helper"
      inert={advancing ? "" : undefined}
      className={cn("mt-6 flex w-full flex-col items-center transition duration-300 ease-out", advancing && "pointer-events-none -translate-y-3 opacity-0")}
    >
      <h2
        id="publish-question"
        ref={headingRef}
        tabIndex={-1}
        className={cn("text-balance text-2xl font-semibold tracking-tight text-strong outline-none sm:text-3xl", enterClass)}
        style={enterDelay(0)}
      >
        {question}
      </h2>
      <p id="publish-helper" className={cn("mt-3 max-w-md text-pretty text-base leading-relaxed text-ink-600", enterClass)} style={enterDelay(1)}>
        {helper}
      </p>
      <div className={cn("mt-9 w-full space-y-5 text-left", enterClass)} style={enterDelay(2)} onKeyDown={onFieldsKeyDown}>
        {children}
      </div>
      {actions ? (
        <div
          className={cn("sticky bottom-0 z-10 mt-1 flex w-full flex-wrap items-center justify-center gap-2 bg-gradient-to-t from-surface from-60% to-transparent pb-1 pt-8", enterClass)}
          style={enterDelay(3)}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
