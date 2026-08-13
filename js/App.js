/* App:静态布局骨架 = Nav + 5 个 section,无场景观察器 */
(function () {
  function App() {
    return (
      <div className="site">
        <Nav />
        <main>
          <Hero />
          <About />
          <Projects />
          <Skills />
          <Contact />
        </main>
      </div>
    );
  }

  Object.assign(window, { App: App });
})();
