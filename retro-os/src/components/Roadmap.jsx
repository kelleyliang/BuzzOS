import "./Journal.css";

export default function Roadmap() {
  return (
    <div className="journal">
      <header><span className="journal-eyebrow">WORK IN PROGRESS</span><h2>Where BuzzOS is headed</h2><p>A home for project ideas and improvements.</p></header>
      <section><h3>Desktop polish</h3><ul><li>Improve dynamic window sizing and initial layouts</li><li>Add a desktop menu</li><li>Create a Buzz loading screen and error messages</li></ul></section>
      <section><h3>More things to play with</h3><ul><li>Tic-tac-toe</li><li>A simple paint app</li><li>More Pomodoro timer options</li></ul></section>
      <section><h3>A little more character</h3><ul><li>More Buzz artwork and small surprises</li><li>A home for image credits</li></ul></section>
      <footer>See Updates for what’s already landed.</footer>
    </div>
  );
}
