import * as React from 'react'
import { Link } from 'react-static'
import makeAware, { ReceiverProps } from 'react-organism'
import CodeEditor from 'react-monaco-editor'
import { Section as PreviewSection } from '../../types/source'
import * as Editing from '../../state/editing'
import { listTags, stripTags, tagsToInput } from '../../utils/tags'
import * as markdownUtils from '../../utils/markdown'
import PreviewItem from '../../components/Preview/Item'

interface Props {}

type State = Editing.State

function toPreviewSections(content: string): PreviewSection[] {
  return content.split(/\*\*\*+|---+/).map(subsectionContent => ({
    headings: markdownUtils.listHeadings(subsectionContent),
    listItems: markdownUtils
      .listListItems(subsectionContent)
      .map(text => ({ content: { text: stripTags(text), tags: listTags(text) }, childItems: [] })),
  }))
}

const Editor: React.ComponentClass<Editing.Props> = makeAware(
  ({ sections, handlers }: State & ReceiverProps<Editing.HandlersOut>) => (
    <div>
      {sections.map((section, sectionIndex) => (
        <>
          <button
            className="mb-4 bg-black text-white"
            onClick={() => handlers.insertSection(sectionIndex)}
          >
            +
          </button>
          <div key={sectionIndex} className="col">
            <input
              className="mb-2 px-2 py-1 border"
              value={section.name}
              onChange={e =>
                handlers.editSectionName(sectionIndex, e.target.value)
              }
            />
            <div className="row">
              <div className="flex-1">
                <CodeEditor
                  height={400}
                  language="markdown"
                  value={section.content}
                  theme="vs-light"
                  options={{
                    fontSize: 16,
                  }}
                  onChange={(newValue: string) => {
                    handlers.editSectionContent(sectionIndex, newValue)
                  }}
                />
              </div>
            </div>
            <PreviewItem
              tags={listTags(section.name)}
              text={stripTags(section.name)}
              sections={toPreviewSections(section.content)}
              frontmatter={markdownUtils.extractFrontmatter(section.content)}
            />
          </div>
        </>
      ))}
      <button
        className="mt-4 bg-black text-white"
        onClick={() => handlers.insertSection(sections.length)}
      >
        +
      </button>
    </div>
  ),
  Editing
)

const editorProps: Editing.Props = {
  initialSections: [
    {
      name: '#nav #primary',
      content: `
- Example #logo

***

- Features
- Pricing
- Sign In
- Sign Up #primary
`.trim(),
    },
  ],
}

class EditPage extends React.PureComponent<Props, {}> {
  render() {
    return (
      <div>
        <h1 className="mt-8 mb-8">{'Prototype with Markdown'}</h1>

        <article className="mb-8">
          <Editor {...editorProps} />
        </article>
      </div>
    )
  }
}

export default EditPage
