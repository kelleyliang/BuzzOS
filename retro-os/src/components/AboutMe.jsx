import buzz from "../assets/buzz.png";
import "./Journal.css";

export default function AboutMe() {
  return (
    <div className="journal">
      <header className="buzz-intro"><img src={buzz} alt="Buzz, the character behind BuzzOS" /><div><span className="journal-eyebrow">THE CHARACTER BEHIND THE DESKTOP</span><h2>Meet Buzz.</h2><p>A little rough around the edges. Still learning.</p></div></header>
      <section><h3>From a physics notebook</h3><p>Buzz is a character I first drew in high school physics. He’s curious about life and often finds himself going through very human experiences. Bringing him into my work adds a personal touch—and makes building things more fun.</p></section>
      <section><h3>A project that keeps growing</h3><p>It’s easy to fixate on a polished outcome, but BuzzOS will never be fully “complete.” That gives me room to build freely, follow what interests me, and add small details and easter eggs along the way.</p><p>Each application has its own window and state. Behind the desktop, I’m exploring window management, dragging and resizing, component architecture, and OS-like interactions.</p></section>
      <section><h3>Life happened along the way</h3><p>BuzzOS started as an idea, became part of a recruiting pitch, lived in notebook drawings, and finally made it into a Git commit. During that time, I:</p><ul><li>Applied for 200+ jobs</li><li>Read 3 books</li><li>Had ACL surgery</li><li>Learned to walk again</li></ul></section>
      <footer>Still building. Still curious.</footer>
    </div>
  );
}
