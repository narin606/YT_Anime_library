import { SearchAnime } from "./search-anime";

const libraryRows = [
  { title: "Continue watching", subtitle: "Your unfinished episodes will return here.", accent: "violet" },
  { title: "Recently added", subtitle: "Freshly indexed releases from official channels.", accent: "cyan" },
  { title: "Browse by genre", subtitle: "Fantasy, action, comedy, romance and more.", accent: "gold" }
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="YT Anime Library home">
          <span className="brandMark">遊</span>
          <span><strong>YT Anime Library</strong><small>Official sources. One library.</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#top">Home</a>
          <a href="#discover">Discover</a>
          <a href="#library">My library</a>
          <a className="signInLink" href="/login">Sign in</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="heroGlow" />
        <div className="heroContent">
          <span className="eyebrow">Your personal anime index</span>
          <h1>Find the anime.<br /><em>Not the channel.</em></h1>
          <p>Explore official YouTube releases through a catalogue organized by series, season and episode.</p>
          <div className="heroActions">
            <a className="primaryAction" href="#discover">Explore catalogue</a>
            <a className="secondaryAction" href="#library">See your library</a>
          </div>
          <ul className="trustList" aria-label="Library principles">
            <li>Official YouTube playback</li>
            <li>AniList-powered metadata</li>
            <li>Progress stays yours</li>
          </ul>
        </div>
        <div className="heroArt" aria-hidden="true">
          <div className="orb orbOne" /><div className="orb orbTwo" /><div className="heroGlyph">アニメ</div>
        </div>
      </section>

      <SearchAnime />

      <section className="library" id="library" aria-labelledby="library-heading">
        <div className="sectionHeading">
          <div><span className="eyebrow">Made for watching</span><h2 id="library-heading">Your library, taking shape</h2></div>
          <p>These collections will fill as episodes and viewing profiles are connected.</p>
        </div>
        <div className="libraryGrid">
          {libraryRows.map((row, index) => (
            <article className={`libraryCard ${row.accent}`} key={row.title}>
              <span className="cardNumber">0{index + 1}</span>
              <h3>{row.title}</h3><p>{row.subtitle}</p>
              <div className="miniPosters">{[1, 2, 3].map((item) => <span key={item} />)}</div>
            </article>
          ))}
        </div>
      </section>

      <footer><span>YT Anime Library</span><p>Metadata and viewing state only. Video remains on YouTube.</p></footer>
    </main>
  );
}
