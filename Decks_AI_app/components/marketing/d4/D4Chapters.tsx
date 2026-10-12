import { getTemplate, TEMPLATES } from '@/lib/deckTemplates'
import { SlideMock } from '../SlideMock'
import { CHAPTERS } from './chapters'
import { D4Chapter } from './D4Chapter'
import { D4FeatureRow } from './D4FeatureRow'
import { D4Plate } from './D4Plate'

const [prompt, structure, themes, edit, present, exportCh] = CHAPTERS

const ledger = getTemplate('ledger')
const noir = getTemplate('noir')
const bloom = getTemplate('bloom')
const riso = getTemplate('riso')

/** A plate whose body is set type rather than a slide mock — used where the
 * point is a capability, not a visual. */
function Note({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="d4-plate-note">
      <b>{heading}</b>
      <span>{children}</span>
    </div>
  )
}

export function D4Chapters() {
  return (
    <>
      <D4Chapter
        meta={prompt}
        lead={<>It begins with a single line of <em>intent</em>.</>}
        lede="One sentence is enough. If the prompt is genuinely ambiguous, Deck AI asks a single clarifying question — then builds the whole deck."
      >
        <D4FeatureRow cols={2}>
          <D4Plate
            title="From one prompt"
            body="Structure, copy, and design are generated together, not stitched from a template."
          >
            <SlideMock
              template={ledger}
              kind="cover"
              title="Q3 in review"
              subtitle="Quarterly business review · generated from one prompt"
            />
          </D4Plate>
          <D4Plate
            stagger={1}
            title="One question, at most"
            body="You approve the outline before anything is designed. No surprises."
          >
            <Note heading="Describe it in a sentence.">
              A pitch deck for a bakery subscription startup — Deck AI takes it from there.
            </Note>
          </D4Plate>
        </D4FeatureRow>
      </D4Chapter>

      <D4Chapter
        meta={structure}
        lead={<>Structure follows the <em>argument</em>, not a template.</>}
        lede="Deck AI reasons about the story first — what opens, what builds the case, what closes — then lays out sections to match."
      >
        <D4FeatureRow cols={3}>
          <D4Plate title="Story-first outline" body="Sections are ordered by narrative logic, not a fixed slide count.">
            <SlideMock
              template={noir}
              kind="cards"
              title="Why now"
              cards={[
                { value: '01', label: 'The problem' },
                { value: '02', label: 'The market' },
                { value: '03', label: 'The ask' },
              ]}
            />
          </D4Plate>
          <D4Plate stagger={1} title="Rearrange freely" body="Reorder, merge, or split any section before a slide is designed.">
            <Note heading="Drag to reorder.">
              The outline is yours to edit while it is still cheap to change.
            </Note>
          </D4Plate>
          <D4Plate stagger={2} title="Approve, then generate" body="Nothing is rendered until the storyline reads right to you.">
            <Note heading="You hold the gate.">
              Review the arc, adjust it, and only then let the design run.
            </Note>
          </D4Plate>
        </D4FeatureRow>
      </D4Chapter>

      <D4Chapter
        meta={themes}
        lead={<>Six themes, each a complete <em>design system</em>.</>}
        lede="Type, colour, spacing and chart language move together — never a single swapped accent colour. Fine-tune anything once a theme is close enough."
      >
        <D4FeatureRow cols={3}>
          {TEMPLATES.slice(0, 3).map((t, i) => (
            <D4Plate key={t.id} stagger={i} title={t.name} body={`${t.name} template`}>
              <SlideMock template={t} kind="cover" title={t.name} />
            </D4Plate>
          ))}
        </D4FeatureRow>
      </D4Chapter>

      <D4Chapter
        meta={edit}
        lead={<>Every block answers to a plain <em>instruction</em>.</>}
        lede="Select a title, a stat, a chart — one block or several at once — and describe the change. Ask AI rewrites it in place, in the deck's own voice."
      >
        <D4FeatureRow cols={2}>
          <D4Plate title="Ask AI, in place" body="Six block types, each independently selectable and editable.">
            <SlideMock
              template={bloom}
              kind="statement"
              title="Make this punchier"
              body="Ask AI rewrites the selected block in place, in your deck's own voice."
            />
          </D4Plate>
          <D4Plate
            stagger={1}
            title="Multi-select"
            body="Edit several slides in one sentence rather than one block at a time."
          >
            <Note heading="Select three things. Fix them in one sentence.">
              Ask AI applies a single instruction across every block you picked.
            </Note>
          </D4Plate>
        </D4FeatureRow>
      </D4Chapter>

      <D4Chapter
        meta={present}
        lead={<>One canvas, scaled to any <em>room</em>.</>}
        lede="Present mode renders a single fixed canvas and scales it uniformly, so what you designed is exactly what the room sees."
      >
        <D4FeatureRow cols={2}>
          <D4Plate title="Present from the browser" body="No export step required to stand up and show the work.">
            <SlideMock
              template={riso}
              kind="cover"
              title="Spring Launch"
              subtitle="Campaign readout · ready to present"
            />
          </D4Plate>
          <D4Plate stagger={1} title="Laptop or conference-room TV" body="The same fixed canvas, scaled — never reflowed.">
            <Note heading="What you designed is what they see.">
              Uniform scaling keeps every margin and type size exactly where you put it.
            </Note>
          </D4Plate>
        </D4FeatureRow>
      </D4Chapter>

      <D4Chapter
        meta={exportCh}
        lead={<>It leaves as PowerPoint, PDF, or a <em>page</em>.</>}
        lede="The deck is usable the moment it's done — editable where you need it to be, fixed where you don't."
      >
        <D4FeatureRow cols={3}>
          <D4Plate title="PowerPoint" body="Hand it to a team that will keep editing in their own tools.">
            <Note heading="PPTX">Editable slides, not a flattened image per page.</Note>
          </D4Plate>
          <D4Plate stagger={1} title="PDF" body="Fixed, portable, and safe to send to anyone.">
            <Note heading="PDF">Exactly what you presented, pinned down.</Note>
          </D4Plate>
          <D4Plate stagger={2} title="Standalone web page" body="A link that opens anywhere, no download needed.">
            <Note heading="Web">Share the deck as a page instead of a file.</Note>
          </D4Plate>
        </D4FeatureRow>
      </D4Chapter>
    </>
  )
}
