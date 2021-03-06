import * as React from 'react'
import { Link } from 'react-static'
import { Location } from 'history'
import queryFromLocation from '../nav/queryFromLocation'
import { queryESInGitHubRepo, GraphQLResult } from '../services/source'
import { GitHubSource, File } from '../types/source'
import JavaScriptFile from '../components/File/JavaScriptFile'
import LinkList from '../components/LinkList'

const Grid = ({
  Component = 'div',
  children,
  columns,
  gap,
}: {
  Component?: React.ComponentClass | React.StatelessComponent | string
  children: any
  columns?: string | number
  gap: string | number
}) => (
  <Component
    style={{
      display: 'grid',
      gridTemplateColumns:
        typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
      gridGap: gap,
    }}
  >
    {children}
  </Component>
)

interface Props {
  location: Location
}

interface State {
  owner: string
  repoName: string
  results: Map<string, GraphQLResult<{ source: GitHubSource }>>
  fileSearch: string
}

const keyForOwnerAndRepo = (owner: string, repoName: string) =>
  [owner, repoName].join('/')

class LibrariesPage extends React.PureComponent<Props, State> {
  state: State = {
    owner: '',
    repoName: '',
    results: new Map(),
    fileSearch: '',
  }

  static getDerivedStateFromProps(
    nextProps: Props,
    prevState: State
  ): Partial<State> | null {
    let { owner = '', repoName = '' } = queryFromLocation(nextProps.location)
    owner = owner.trim()
    repoName = repoName.trim()

    return { owner, repoName }
  }

  get canLoad() {
    const { owner, repoName } = this.state
    if (owner === '' || repoName === '') {
      return false
    }

    return true
  }

  load() {
    if (!this.canLoad) {
      return
    }

    const { owner, repoName } = this.state
    queryESInGitHubRepo(owner, repoName, {
      includeContent: true,
      // pathPrefixes: ['react/'],
      pathMatching: ['**/*.(js|css|less|scss|svg)'],
      pathNotMatching: [
        '**/test/**',
        '**/__snapshots__/*',
        '**/*.config.js',
        '**/*.demo.js',
        '**/*.test.js',
        '**/*.sketch.js',
        '**/private/**',
      ],
    }).then(source => {
      this.setState(({ results }) => {
        const newResults = new Map(results.entries())
        newResults.set(keyForOwnerAndRepo(owner, repoName), source)
        return { results: newResults }
      })
    })
  }

  get currentResult(): GraphQLResult<{ source: GitHubSource }> | null {
    const { owner, repoName } = this.state
    const key = keyForOwnerAndRepo(owner, repoName)
    return this.state.results.get(key)
  }

  onChangeFileSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ fileSearch: e.target.value })
  }

  render() {
    let { fileSearch, owner, repoName } = this.state
    const result = this.currentResult

    fileSearch = fileSearch.trim()
    const includeFile: (file: File) => boolean =
      fileSearch === ''
        ? () => true
        : file => file.path.toLowerCase().indexOf(fileSearch) !== -1

    const filteredFiles =
      !!result && !!result.data && !!result.data.source.files
        ? result.data.source.files.filter(includeFile)
        : null

    return (
      <div>
        <article className="mb-8">
          {this.canLoad && <Link to="/libraries/">Libraries</Link>}

          <h1 className="mt-2 mb-4">
            {!this.canLoad && 'Libraries'}
            {this.canLoad && `${owner} / ${repoName}`}
            {this.canLoad && (
              <iframe
                className="ml-4"
                src={`https://ghbtns.com/github-btn.html?user=${owner}&repo=${repoName}&type=star&count=true`}
                frameBorder="0"
                scrolling="0"
                width="170px"
                height="20px"
              />
            )}
          </h1>

          {!this.canLoad && (
            <LinkList noBullets className="text-2xl font-bold">
              <Link to={`/libraries/?owner=seek-oss&repoName=seek-style-guide`}>
                {'Seek Style Guide'}
              </Link>
              <Link
                to={`/libraries/?owner=zendeskgarden&repoName=react-components`}
              >
                {'Zendesk Garden: React Components'}
              </Link>
              <Link to={`/libraries/?owner=pinterest&repoName=gestalt`}>
                {'Pinterest Gestalt'}
              </Link>
              <Link to={`/libraries/?owner=Shopify&repoName=polaris`}>
                {'Shopify Polaris'}
              </Link>
              <Link to={`/libraries/?owner=pluralsight&repoName=design-system`}>
                {'Pluralsight Design System'}
              </Link>
              <Link to={`/libraries/?owner=pivotal-cf&repoName=pivotal-ui`}>
                {'Pivotal UI'}
              </Link>
            </LinkList>
          )}

          {this.canLoad && !result && <p>Loading files from GitHub…</p>}
          {this.canLoad &&
            !!result &&
            !!result.errors && (
              <div>
                {result.errors.map(error => (
                  <p key={error.message}>
                    {'Error: '}
                    {error.message}
                  </p>
                ))}
              </div>
            )}
          {this.canLoad &&
            !!result &&
            !!result.data && (
              <div>
                {!!result.data.source.npmProjects && (
                  <div className="mb-8">
                    <h2 className="my-2">Packages</h2>
                    {result.data.source.npmProjects.map(npmProject => (
                      <div key={npmProject.directoryPath} className="mb-8">
                        <h3 className="my-2">
                          {npmProject.name} @ {npmProject.version}
                        </h3>
                        {npmProject.directoryPath !== '.' && (
                          <p className="my-2">
                            <em>{npmProject.directoryPath}</em>
                          </p>
                        )}
                        <Grid columns="repeat(auto-fill, 12rem)" gap={10}>
                          {npmProject.dependencies.items.map(item => (
                            <div key={item.name}>
                              <div className="font-bold">{item.name}</div>
                              <div>{item.rule}</div>
                            </div>
                          ))}
                        </Grid>
                      </div>
                    ))}
                  </div>
                )}
                {!!filteredFiles && (
                  <div>
                    <h2>
                      {'Files '}
                      <input
                        className="mx-2 px-2 py-1 text-base font-normal"
                        value={fileSearch}
                        placeholder="Filter files…"
                        onChange={this.onChangeFileSearch}
                      />
                      <small>{` ${filteredFiles.length}`}</small>
                    </h2>
                    {filteredFiles.map(file => (
                      <div key={file.path} className="my-4">
                        <h4>{file.path}</h4>
                        {!!file.asJavaScript && (
                          <JavaScriptFile
                            file={file}
                            allFiles={result.data.source.files}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </article>
      </div>
    )
  }

  componentDidMount() {
    this.load()
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { owner, repoName } = this.state
    if (owner !== prevState.owner || repoName !== prevState.repoName) {
      this.load()
    }
  }
}

export default LibrariesPage
