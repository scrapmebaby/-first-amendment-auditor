// Original dialogue. No runtime language model, network calls, or borrowed game lines.
const lines = (text) =>
  text
    .trim()
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
export const BANKS = {
  plea: lines(`Why are you doing this?
Please stop. I have somewhere to be.
We don’t want to be filmed.
Can my lunch break just be a lunch break?
You have your answer. Please give me some space.
Is there a reason you’re following me?
Please point that at literally anything else.
I didn’t volunteer for your channel.
My bad day is not your episode.
I asked politely. I’m still asking politely.
Who is this supposed to help?
Can we skip to the part where you leave?`),
  recognize: lines(`You’re that camera asshole. We know what you do.
My cousin was in your thumbnail. You spelled her name wrong.
Oh, it’s the guy who edits out the first five minutes.
The group chat warned us you were coming.
Didn’t you declare victory over a parking meter yesterday?
I saw the uncut version. Funny how different that was.
You again? The sidewalk must owe you money.
Last time you called this an investigation. You investigated my sandwich.`),
  argue: lines(`Get that fucking camera out of my face!
You edited out what you said first!
I said BACK OFF, asshole!
Go get a real fucking job!
You’ve asked the same question six different ways!
A microphone doesn’t make you my supervisor!
Stop narrating over my answer!
You want a reaction? Congratulations, I’m irritated!
I’m not suppressing the press. I’m carrying groceries!
You keep saying public interest. Where is the public interest?
Film the part where everyone asks you to leave!
You can’t yell “calm down” louder than I’m talking!
Your camera has a stabilizer. Get one for your personality!
No, I will not say that again for the thumbnail!
The Constitution is not a coupon for my afternoon!
I’m not doing a second take of being pissed off!`),
  cry: lines(`Please, I’ve had a terrible day. Just leave me alone.
I don’t want to be in your fucking video.
Why won’t you just stop?
I need a minute. Please back up.
I’m trying to breathe. Stop asking questions.
Please don’t put my face online.
I said no. Why wasn’t that enough?
Can somebody stay with me until this is over?`),
  leave: lines(`I’m leaving. Please stop following me.
No thanks. I’m going somewhere else.
Have fun filming an empty sidewalk.
You can argue with the door after I’m through it.
I’m taking the long way. Enjoy the pavement.
This conversation has used up my entire break.
You don’t get an exit interview.
I have errands. You have a battery. Let’s both run out elsewhere.`),
  music: lines(`Enjoy my royalty-trap playlist.
The whole block has speakers, buddy.
This conversation now has a soundtrack.
Funny how the microphone suddenly became a problem.
You brought a camera. I brought a speaker.
Let’s see your editor untangle this chorus.`),
  stink: lines(`Here’s your breaking news. It stinks.
Consider this an atmospheric review of your channel.
You wanted local color. That’s local odor.
Your microphone can’t edit the smell out.
Now everybody has a reason to leave.
That’s my review. Zero stars.`),
  cup: lines(`Here! Film my fucking coffee!
There goes my drink. Happy now?
Put THAT in your little documentary!
You wanted a splashy opening!
That coffee cost more than your last video earned!
I was saving that for my break!`),
  contact: lines(`Back the fuck off!
Get that out of my face!
I said give me room!
Stop pushing that camera toward me!
Don’t stand right in front of me!
Enough! Move!`),
  damage: lines(`It barely fell! That piece of shit was already broken!
That crack was there before! Mostly!
I moved it. I didn’t know it would hit the ground!
You can’t prove which scratch was mine!
That thing was held together with tape!
I didn’t mean for the whole tripod to go!`),
  minimize: lines(`It wasn’t that bad! They’re exaggerating everything!
It was just a little push. Look at them milking it!
They’re leaving out everything that happened first!
Ask the people who were here before the camera came on!
I lost my temper. That doesn’t make their version true!
They’re acting like I knocked down a building!
Can we see the beginning of the video?
I shouldn’t have done that. But listen to the whole story!`),
  sprayed: lines(`What the fuck—you sprayed me! I can’t see!
My eyes! Get that camera away!
Somebody help me. Please!
Stop filming and give me some room!
I can’t open my eyes!
Why are you still narrating this?`),
  arrest: lines(`Wait—seriously? You filmed the whole thing, right?
Can somebody call my sister? My car is still here!
Please tell me this part isn’t going online.
I have work tomorrow. Oh, no.
You got your ending. Are you happy now?
I’ll walk. Just stop pointing that at me.
I want them to show what happened before this!
I can’t believe my entire day turned into this.`),
  officer: lines(`I know your channel. I dislike the stunt. We still investigate reported crimes.
My opinion of your videos isn’t the test. Tell me what happened.
One person at a time. The camera doesn’t decide who talks first.
I need facts, not the title you’ve already picked.
Keep your distance while I speak with everyone.
Show me the full recording, including the lead-up.
A complaint gets documented. It does not come with a guaranteed ending.
I heard your demand. Now I need the evidence.`),
  noArrest: lines(`We’ll review the full footage. Your demand alone isn’t grounds for an arrest.
I’m documenting both accounts. I’m not making an arrest here.
You can make a complaint. You cannot dictate my conclusion.
Calling this a scandal doesn’t change the evidence.
Everyone separate. We’re reviewing what actually happened.
A case number is not a verdict.`),
  auditor: lines(`Am I being detained?
I’m gathering content for a story.
You work for me.
There’s no expectation of privacy!
I don’t answer questions.
I’m exercising my rights.
Please state your authority for disliking me.
My channel is an independent oversight committee of one.
I’m conducting a constitutional vibe check.
Your sigh has been entered into evidence.
Is that an official request or a personal emotion?
I reserve the right to misunderstand your answer.
I’m standing on a publicly funded patch of attitude.
This is investigative journalism with a subscribe button.
I’m requesting the supervisor of this conversation.
I will be appealing your tone.
My viewers are the court of public opinion.
You have the right to remain in my thumbnail.
I’m not creating a disturbance. I’m documenting the one around me.
I pay taxes on at least some of my transactions.
I need your name, title, and preferred spelling of scandal.
This is a nonconsensual customer satisfaction survey.
I’m invoking the doctrine of you touched my stuff.
You cannot trespass me from my own narrative.`),
  jargon:
    lines(`That’s battery on an independent journalist! I demand a supervisor and a case number!
I’m requesting constitutional priority processing and a supervisor!
This is interference with my federally imagined press credentials!
I reserve every right I can remember and several I just invented!
Please preserve the evidence and my best camera angle!
I demand a case number before my battery dies!
I’m placing your hesitation under formal verbal review!
My status as the narrator establishes that I’m the victim!`),
  paperwork: lines(`They’re going to get away! Why am I doing paperwork?
They’re walking away while I’m filling in boxes!
Can I submit the thumbnail as my statement?
Why does “describe what happened” include what I did?
The suspect is leaving and you’re checking my spelling!
This form is interfering with my dramatic conclusion!`),
  bystander: lines(`They asked you to stop. That should have been enough.
I’m staying here as a witness. To the whole thing.
Nobody touch anybody. This is already ridiculous.
I came here for a sandwich, not a season finale.
Funny how the camera keeps missing the first part.
Can everyone leave a path through the sidewalk?
There are actual problems two streets over.
I’m recording too. Mine starts before the shouting.`),
  crew: lines(`We’ve spent forty minutes earning eleven cents.
Do we invoice for standing here looking stupid?
The shirt is starting to feel like a confession.
You said there would be lunch money.
Should I film the context or is that extra?
Our gas bill is beating our subscriber count.
I’m holding a microphone and several regrets.
The battery is low. So is team morale.`),
  thanks: lines(`Thanks for the help.
That actually made my day easier.
Appreciate it. See you next shift.
You didn’t film it. You just did it. Thanks.
It’s nice having another pair of hands.
Coffee’s on the counter. You earned a break.`),
  library: lines(`People are trying to read. This isn’t a studio.
You can find the Constitution on a shelf. Quietly.
The quiet zone applies to your commentary too.
Our books have context. Try keeping some.
Please leave the readers out of your video.
The returns slot is for books, not complaints about my face.`),
  cafe: lines(`Your order was a coffee, not an audience.
The milk is steaming enough for both of us.
You’re blocking the pickup counter.
Please let the next customer order.
I get one break. This is it.
Your press credentials don’t come with free refills.`),
  civic: lines(`Take a number. Your camera doesn’t move you up the queue.
People have private paperwork. Give them space.
The forms are free. My patience is not unlimited.
I can explain the procedure if you stop talking over me.
You can ask for a record without filming everyone’s address.
The counter closes at five. Your speech doesn’t extend it.`),
  rain: lines(`Even the weather wants this conversation over.
I’m getting soaked. Can we finish this?
Your lens has water on it. There’s your cover-up.
I left my umbrella inside. Please let me pass.`),
};
export function language(text, explicit = false) {
  if (explicit) return String(text);
  return String(text)
    .replace(/\bpiece of shit\b/gi, 'Poop')
    .replace(/\bfuck(?:ing|ed|er|s)?\b/gi, '[bleep]')
    .replace(
      /\b(?:shit(?:ty|s|ting)?|bullshit|assholes?|bastards?|bitch(?:es)?|piss(?:ed|ing)?|damn|hell|crap)\b/gi,
      '[bleep]',
    );
}
export class Dialogue {
  constructor(random = Math.random) {
    this.random = random;
    this.bags = new Map();
    this.last = new Map();
  }
  pick(event, context = {}) {
    let key = event;
    if (event === 'plea') {
      const place = context.place || '';
      const special = /library/i.test(place)
        ? 'library'
        : /grind|café|cafe/i.test(place)
          ? 'cafe'
          : /city hall|post office|court/i.test(place)
            ? 'civic'
            : context.weather === 'rain'
              ? 'rain'
              : null;
      if (special && this.random() < 0.45) key = special;
    }
    if (!BANKS[key]) throw Error('Unknown dialogue event: ' + key);
    let bag = this.bags.get(key);
    if (!bag?.length) {
      bag = BANKS[key].map((_, i) => i);
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
    return language(BANKS[key][index], context.explicit);
  }
}
