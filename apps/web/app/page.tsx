const sampleAnime = [
  { title: "Continue Watching", subtitle: "Your unfinished episodes will appear here." },
  { title: "Recently Added", subtitle: "Newly indexed official episodes." },
  { title: "Browse by Genre", subtitle: "Fantasy, action, comedy, romance and more." }
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <div>
          <strong>YT Anime Library</strong>
          <p>Anime-first browsing. YouTube-powered playback.</p>
        </div>
        <nav>
          <a href="#">Home</a>
          <a href="#">Browse</a>
          <a href="#">My List</a>
        </nav>
      </header>

      <section className="hero">
        <span className="eyebrow">Personal streaming library</span>
        <h1>Find the anime, not the channel.</h1>
        <p>
          Official YouTube sources organized by title, episode and genre, with watch
          progress and profiles layered on top.
        </p>
      </section>

      <section className="rows">
        {sampleAnime.map((row) => (
          <article className="rowCard" key={row.title}>
            <h2>{row.title}</h2>
            <p>{row.subtitle}</p>
            <div className="placeholderGrid">
              {[1, 2, 3, 4, 5].map((item) => <div className="poster" key={item} />)}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
