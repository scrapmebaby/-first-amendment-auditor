// Original fictional exchanges. Sources informed situations, not copied dialogue.
// Each row is auditor / civilian / auditor / civilian, kept together for coherence.
import { language } from './dialogue.js';
const group = (text) =>
  text
    .trim()
    .split('\n')
    .map((row) => row.split('|').map((s) => s.trim()));
export const EXCHANGES = {
  street:
    group(`This is an independent review of public behavior. | My public behavior is waiting for a bus. | Your cooperation would make the review much shorter. | So would your bus arriving.
I'm documenting how this neighborhood treats the press. | The neighborhood is buying bread. | Would you describe that as a refusal to comment? | I'd describe it as a baguette.
My viewers deserve to know what's happening here. | I'm carrying a broken toaster to the bin. | That could indicate a wider pattern. | Yes. Appliances eventually stop working.
I'm making sure nobody interferes with this camera. | You walked over here to tell me that? | Preventive accountability. | Try preventive distance.
You seem uncomfortable with transparency. | I have spinach in my teeth and you're zooming in. | The lens doesn't discriminate. | Your editing software probably does.
This interaction is being preserved for the public record. | Great. Preserve my request to be left alone. | I'll include the relevant parts. | That's the part. All of it.
I'm here to educate the public about their rights. | Do those lessons come with an unsubscribe button? | Civic education isn't optional. | Neither is my lunch break, apparently.
I'm conducting a very serious investigation. | Into what? | I'm waiting for the evidence to reveal itself. | Then point that thing at your expense receipts.
Am I being detained by this conversation? | I'm waiting for the crossing light. I'm not a cop. | Then I'm free to continue my investigation. | And I'm free to cross when the little man turns green.
Are you acting under color of law? | I'm acting under this umbrella. | Your evasiveness has been noted. | So has the rain going down my neck.
I reserve all rights, remedies and potential advertising revenue. | At least the last part explains the camera. | That was a legally protected disclosure. | It sounded more like a business plan.
You have interfered with my constitutional fieldwork. | I asked if you could move your bag. | I'll need your full name for the complaint. | Put down Person Trying Not To Trip.`),
  civic:
    group(`I require the official rule governing this queue. | Take a ticket. The numbers go upwards. | Is that a policy or a law? | It's a way of knowing whose turn it is.
I'd like your supervisor's supervisor for an on-camera statement. | On what subject? | The lack of immediate access to supervisors. | You've invented an infinite staircase.
This counter was paid for with public money. | So were the chairs. You can sit while you wait. | Are you ordering a member of the press to sit? | I'm offering your knees a break.
I'm inspecting this facility for transparency. | Then please stop filming the addresses on those forms. | I can't help what enters my frame. | You appear to be holding the thing that controls it.
I am invoking the municipal silence clause. | That isn't on any of our forms. | It's a doctrine I developed through extensive research. | Was the research a comment section?
I demand an official statement about your refusal to answer. | I've answered twice. The office opens at nine. | Then why is the door still locked? | Because it's eight forty-seven. Would you like that in writing?`),
  library:
    group(`I'm reviewing the public's access to information. | Wonderful. The catalog is right behind you. | I'm more interested in the restrictions. | Start with the book on quiet voices.
I'm documenting this reading area. | Please keep people's screens out of the shot. | How can I document what I'm not allowed to show? | Try the architecture. It doesn't have a password.
I'd like to interview everyone about intellectual freedom. | That reader has headphones on for a reason. | Silence is also a statement. | Then let them finish making it.
Is there a written rule about my commentary? | This is the quiet floor. | My documentary needs natural sound. | The natural sound here was silence.`),
  cafe: group(`I'm evaluating this establishment's attitude toward cameras. | Would the camera like anything to drink? | It doesn't need to buy anything to observe. | Neither does the pigeon. It waits outside.
People in here deserve transparency. | They deserve their coffees before they get cold. | Are you prioritizing commerce over my investigation? | At a coffee shop? Astonishingly, yes.
I need an uninterrupted statement for my audience. | I need an uninterrupted route to that table. | You're stepping into my shot. | You've set up your shot in my lunch break.
What's the official complaint process here? | Tell me what's wrong with your order. | The lack of respect for my credentials. | I can't remake a credential with oat milk.`),
  recognized:
    group(`You may recognize me from my accountability work. | I recognize the freeze-frame of my neighbor sneezing. | That image illustrated a public concern. | It illustrated a pollen allergy.
I'm back to see whether anything has improved. | We bought curtains. | That's a concerning reduction in transparency. | That's a perfectly ordinary reduction in glare.
Last time, my audience had serious questions. | Did any of them ask where the missing five minutes went? | Editing is part of journalism. | So is answering a question.
I'm offering the town a chance to correct the record. | Upload the beginning of the video, then. | That part doesn't advance the story. | Funny. It's where the story happened.`),
  heated:
    group(`Your reaction is becoming the story. | You've been narrating my damn errands for ten minutes. | I'm not responsible for how you choose to react. | You're very invested in the result, though.
I need you to lower your voice for the record. | You just asked me to repeat it louder! | The microphone wasn't picking you up. | Then it has better boundaries than you.
Are you trying to intimidate the independent press? | I'm asking you to stop blocking the door. | That sounds like a demand. | Doors are famously difficult to use through people.
I'm remaining completely professional. | You're wearing a clown mask and filming my groceries. | Equipment does not invalidate my investigation. | Neither do groceries create one.`),
  rain: group(`A little weather won't stop this investigation. | It might stop my paper bag holding together. | We all make sacrifices for transparency. | Only one of us is losing oranges.
I'm documenting the conditions on this public sidewalk. | Then document the puddle and let me get past. | Are you directing my coverage? | I'm directing my dry shoe around your foot.
Can you make a brief statement about today's events? | It's raining. I would like to go inside. | Anything else for the viewers? | Bring a coat. Leave people alone.`),
};
export class Banter {
  constructor(random = Math.random) {
    this.random = random;
    this.bags = new Map();
    this.last = new Map();
  }
  pick({ place = '', weather = '', reputation = 0, patience = 100, explicit = false } = {}) {
    let key =
      patience < 50
        ? 'heated'
        : /library/i.test(place)
          ? 'library'
          : /café|cafe|grind/i.test(place)
            ? 'cafe'
            : /city hall|post office|court/i.test(place)
              ? 'civic'
              : weather === 'rain'
                ? 'rain'
                : 'street';
    if (reputation >= 20 && this.random() < 0.35) key = 'recognized';
    let bag = this.bags.get(key);
    if (!bag?.length) {
      bag = EXCHANGES[key].map((_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag.at(-1) === this.last.get(key) && bag.length > 1)
        [bag[0], bag[bag.length - 1]] = [bag.at(-1), bag[0]];
      this.bags.set(key, bag);
    }
    const index = bag.pop();
    this.last.set(key, index);
    return EXCHANGES[key][index].map((text) => language(text, explicit));
  }
}
