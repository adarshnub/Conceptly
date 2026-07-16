import Link from "next/link";
import {
  Activity,
  ArrowRight,
  AudioLines,
  BarChart3,
  BookOpen,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  Code2,
  Flame,
  Gauge,
  Headphones,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  MousePointer2,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  Waypoints,
  Zap,
} from "lucide-react";
import { LandingChallengeDemo } from "@/components/landing-challenge-demo";
import { LandingCore } from "@/components/landing-core";
import { LandingScrollStory } from "@/components/landing-scroll-story";
import { getCourse } from "@/lib/content/course";
import "./landing.css";

const interactionTypes = [
  "Choose",
  "Multi-select",
  "Order",
  "Match",
  "Context budget",
  "Markdown",
  "JSON",
  "Prompt builder",
];

export default function Home() {
  const course = getCourse();
  const stepCount = course.chapters.reduce((total, chapter) => total + chapter.steps.length, 0);

  return (
    <main className="cl-landing">
      <header className="cl-nav-wrap">
        <nav className="cl-nav" aria-label="Main navigation">
          <Link href="/" className="cl-brand" aria-label="Conceptly home">
            <span>C</span>
            <strong>Conceptly</strong>
          </Link>
          <div className="cl-nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#course">Course</a>
            <a href="#features">Features</a>
          </div>
          <div className="cl-nav-actions">
            <Link href="/sign-in" className="cl-text-link">Sign in</Link>
            <Link href="/sign-up" className="cl-button cl-button-light">
              Start learning <ArrowRight size={17} />
            </Link>
          </div>
        </nav>
      </header>

      <section className="cl-hero">
        <div className="cl-hero-grid">
          <div className="cl-hero-copy">
            <div className="cl-live-pill"><span /> AI Foundations is open</div>
            <h1>Don’t just read about AI. <em>Handle it.</em></h1>
            <p>
              Learn through narrated classes, tactile challenges, precise feedback, and a coach that steps in only when you need another angle.
            </p>
            <div className="cl-hero-actions">
              <Link href="/sign-up" className="cl-button cl-button-acid">
                Learn for free <ArrowRight size={18} />
              </Link>
              <a href="#demo" className="cl-button cl-button-ghost">
                <Play size={17} fill="currentColor" /> Try a challenge
              </a>
            </div>
            <div className="cl-hero-facts" aria-label="Course facts">
              <span><strong>{course.chapters.length}</strong> focused chapters</span>
              <span><strong>{stepCount}</strong> interactive steps</span>
              <span><strong>0</strong> paywalls</span>
            </div>
          </div>

          <div className="cl-hero-visual">
            <LandingCore className="cl-hero-core" />
            <div className="cl-orbit-note cl-orbit-note-one">
              <AudioLines size={16} /> Narrated class
            </div>
            <div className="cl-orbit-note cl-orbit-note-two">
              <CheckCircle2 size={16} /> Specific feedback
            </div>
            <div className="cl-orbit-note cl-orbit-note-three">
              <Bot size={16} /> Contextual coach
            </div>
            <span className="cl-core-caption">Hover to reform · move left / right</span>
          </div>
        </div>
        <div className="cl-hero-marquee" aria-label="Available learning interactions">
          <div>
            {[...interactionTypes, ...interactionTypes].map((label, index) => (
              <span key={`${label}-${index}`}><i /> {label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="cl-manifesto" id="how-it-works">
        <div>
          <p className="cl-kicker">Built for the moment an idea clicks</p>
          <h2>A lesson should respond to you.</h2>
        </div>
        <p>
          Conceptly turns explanations into a conversation between your eyes, hands, and ears. It remembers where you stopped, explains why an answer missed, and lets you replay completed work without gaming your progress.
        </p>
      </section>

      <LandingScrollStory />

      <section className="cl-demo-section" id="demo">
        <div className="cl-section-heading">
          <div>
            <p className="cl-kicker">Don’t take our word for it</p>
            <h2>Make one choice.</h2>
          </div>
          <p>This is the same authored feedback rhythm used inside the course—condensed into a landing-page preview.</p>
        </div>
        <LandingChallengeDemo />
      </section>

      <section className="cl-feature-section" id="features">
        <div className="cl-section-heading cl-section-heading-light">
          <div>
            <p className="cl-kicker">One learning system</p>
            <h2>Everything around the lesson matters.</h2>
          </div>
          <p>Conceptly supports the class before the question, the struggle during it, and the momentum after it.</p>
        </div>

        <div className="cl-feature-bento">
          <article className="cl-feature cl-feature-voice">
            <div className="cl-feature-icon"><Headphones size={22} /></div>
            <span className="cl-feature-index">01</span>
            <h3>A voice that stays with the lesson.</h3>
            <p>Hear class narration, questions, options, correct-answer celebration, and misconception cues.</p>
            <div className="cl-waveform" aria-hidden="true">
              {[15, 32, 54, 27, 68, 44, 78, 35, 62, 24, 47, 18].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
              <span><Volume2 size={17} /> OpenAI voice</span>
            </div>
          </article>

          <article className="cl-feature cl-feature-coach">
            <div className="cl-feature-icon"><Sparkles size={22} /></div>
            <span className="cl-feature-index">02</span>
            <h3>AI help with boundaries.</h3>
            <p>After repeated misses, the coach uses the current objective and authored cues to ask one guiding question—without revealing the answer.</p>
            <div className="cl-coach-card">
              <Bot size={20} />
              <div><strong>Try another angle</strong><span>Is the system creating new content, or choosing from labels it already has?</span></div>
            </div>
          </article>

          <article className="cl-feature cl-feature-progress">
            <div className="cl-feature-icon"><Trophy size={22} /></div>
            <span className="cl-feature-index">03</span>
            <h3>Progress you can feel.</h3>
            <p>Resume exactly where you stopped. Earn XP once, build a learning streak, unlock the next step, and review anything completed.</p>
            <div className="cl-stat-row">
              <span><Zap size={16} /><strong>240</strong><small>XP</small></span>
              <span><Flame size={16} /><strong>7</strong><small>day streak</small></span>
              <span><RotateCcw size={16} /><strong>12</strong><small>reviewed</small></span>
            </div>
          </article>

          <article className="cl-feature cl-feature-ledger">
            <div className="cl-feature-icon"><BarChart3 size={22} /></div>
            <span className="cl-feature-index">04</span>
            <h3>See where AI is being used.</h3>
            <p>A private usage ledger tracks requests, tokens, estimated cost, feature, model, and status—so intelligent features never become invisible infrastructure.</p>
            <div className="cl-ledger-mini">
              <div><span>Class voice</span><strong>$0.0142</strong></div>
              <div><span>Coach cue</span><strong>$0.0018</strong></div>
              <div><span>Lesson voice</span><strong>$0.0064</strong></div>
            </div>
          </article>

          <article className="cl-feature cl-feature-system">
            <div className="cl-system-copy">
              <div className="cl-feature-icon"><Layers3 size={22} /></div>
              <span className="cl-feature-index">05</span>
              <h3>Built for learning, not answer collecting.</h3>
              <p>Private solutions stay on the server. Attempts are idempotent. Locked steps stay locked. Review never awards duplicate XP.</p>
            </div>
            <div className="cl-system-flow" aria-label="Learning system flow">
              <span><BookOpen size={18} /> Class</span><ArrowRight size={16} />
              <span><MousePointer2 size={18} /> Challenge</span><ArrowRight size={16} />
              <span><MessageSquareText size={18} /> Feedback</span><ArrowRight size={16} />
              <span><Waypoints size={18} /> Progress</span>
            </div>
          </article>
        </div>
      </section>

      <section className="cl-course" id="course">
        <div className="cl-course-intro">
          <p className="cl-kicker">The course available today</p>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
          <ul>
            <li><Check size={17} /> {stepCount} guided interactions</li>
            <li><Check size={17} /> Narrated classes before challenges</li>
            <li><Check size={17} /> Unlimited access after sign-up</li>
          </ul>
          <Link href="/sign-up" className="cl-button cl-button-dark">
            Start chapter one <ArrowRight size={18} />
          </Link>
        </div>

        <div className="cl-chapter-list">
          {course.chapters.map((chapter, index) => (
            <article key={chapter.id}>
              <div className="cl-chapter-number">0{index + 1}</div>
              <div>
                <span>{chapter.steps.length} steps · {index === 0 ? "Voice class ready" : "Interactive practice"}</span>
                <h3>{chapter.title}</h3>
                <p>{chapter.description}</p>
                <div className="cl-chapter-tags">
                  {index === 0 ? (
                    <><i>Prompts</i><i>Tokens</i><i>Context</i><i>Evidence</i></>
                  ) : (
                    <><i>Markdown</i><i>JSON</i><i>Debugging</i><i>Structure</i></>
                  )}
                </div>
              </div>
              <div className="cl-chapter-status">
                {index === 0 ? <AudioLines size={20} /> : <Braces size={20} />}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cl-trust-strip">
        <div><LockKeyhole size={20} /><span><strong>Private by design</strong> No database or AI secret is sent to the browser.</span></div>
        <div><Gauge size={20} /><span><strong>Graceful fallback</strong> Authored feedback works even when AI is unavailable.</span></div>
        <div><Activity size={20} /><span><strong>Accessible interaction</strong> Keyboard, screen-reader, and reduced-motion support.</span></div>
      </section>

      <section className="cl-final-cta">
        <div className="cl-final-mark"><Code2 size={34} /></div>
        <p className="cl-kicker">Start with two chapters. Leave with a working language.</p>
        <h2>AI becomes useful when it stops feeling abstract.</h2>
        <p>Conceptly is free for every registered learner. No card, no trial clock, no daily limit.</p>
        <Link href="/sign-up" className="cl-button cl-button-acid">
          Create your account <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="cl-footer">
        <Link href="/" className="cl-brand"><span>C</span><strong>Conceptly</strong></Link>
        <p>Interactive AI foundations for adult beginners.</p>
        <div><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Sign up</Link></div>
      </footer>
    </main>
  );
}
