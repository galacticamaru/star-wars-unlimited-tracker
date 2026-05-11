# IDEAS Document

## What This Is
A document where I catalogue ideas / user stories / features to develop out at a later time. Each idea will include a date it was implemented. If Implemented is 'PENDING' than it has not yet been implemented.

## Ideas
### Deck of the day:
Pull up a recent PQ or higher winner. Add a mechanism to view the deck, highlighting any cards that are missing from the collection compared to the deck. Allow the user to copy that deck into their library of decks.
Implemented: PENDING
------
### SWUDB/Karabast deck integration:
To better support Karabast gameplay we need a way to export a deck into Karabast easily. Karabast has a list of supported deckbuilders or a user can paste deck JSON directly.
The supported deck builders are:
- cardcore.gg
- kyberdecks.com
- my-swu.com
- protectthepod.com
- sw-unlimited-db.com
- swubase.com
- swucardhub.fr
- swudb.com
- swuforge.com
- swumetastats.com
- swustats.net

To achieve our goal I see two leading options:
1. Allow users to sync their account to one of these supported deck builders. When a deck is created, automatically create and sync that same deck in swudb. This allows users to use that deck in Karabast and keep any deck changes in sync as Karabast will use the supported deckbuilder. I do not know if any of these deckbuilders has a supported API to achieve such an outcome.
2. If there is no sync support, Create an export option on decks supporting two formats: 1. Melee (melee.gg format) 2. JSON format. The user will be able to use these common formats in Karabast or other deck builders. The main issue with this method is any deck changes will not be kept in sync and requires a manual export. Ensure that the UX for exporting this to Karabast in particular is easy.
Implemented: PENDING
-----
### Card Searching:
If a user types rebel in the search - any card with the Rebel trait or card text that says rebel should be displayed.
Supporting natural language search.
Implemented: 05/05/26
-----
### AI Deck Builder/Assistant:
Perhaps in addition to the planned deck builder, I want a tool that helps players build better decks or get inspiration for a deck.

In practice this looks like two separate assistants:
1. An assistant while deck building
- An assisstant that calculates the likelihood of a turn 1 play. With a recommendation to add more 1 or 2 costed cards if the likelihood is low.
- Displaying the card cost curve - if the curve is poor recommend potential cards to fill the curve
- Suggests cards with a strong synergy with cards the user has already selected, or cards with a high winrate for the leader/base combo the user has selected.

2. An assistant the creates a deck for you
- A natural language assistant that takes a prompt like "create an aggro deck". This assistant will consider the current performing decks, the users' collection, and creates a premiere legal deck with a quick guide on the game plan for the deck.
Implemented: PENDING
-----
### Additional card filters:
Add a new filter for each of; Arenas, Traits, Rarity and Keywords.

Add a new filter component for cost filters: Users can select multiple costs [0],[1],[2] etc. For each cost up to [9+]. [9+] filters cards to cards with a cost of 9 or higher.
Implemented: 05/05/26
-----
### Deck building stats:
Create a section of content that display useful stats about the deck that a user could use to inform their deck building:
- Number of ground units / space units / events / upgrades
- Card aspect breakdown
- Card curve graph
Implemented: 06/05/26
-----
### Card Market Tracking
Unsure how to implement - but displaying a price for a card and a deck price would be helpful. I've noticed that most market trackers use TCGPlayer, which is great, but TCGPlayer isn't supported in Australia where I play. Offering TCGPlayer and another market tracker that is used in Australia would be ideal. 

Do some research on potential AU compatible market trackers that the community uses. Also consider searches on midnightmerchant.com.au or LGS that I know sell singles such as Beskarforce, dragonslair, Grand J Games. 
Implemented: PENDING
-----
### Navigation Improvement
When returning to the catalog from a card details page, we should maintain and card filters or searches the user had.
Implemented: 05/05/26
-----
### Deck Building Clarity / Improvements
1. In the decklist page group the cards in these sections and subsections:
Main Deck:
- Ground Units
- Space Units
- Upgrades
- Events
Sideboard:
- Ground Units
- Space Units
- Upgrades
- Events
2. In the stats sidebar when adding cards to a deck, add an aspect breakdown. Include both a visual and a listed number representation. For the visual representation use a bar chart, similar to the cost curve. The bars should be stylised by the aspect:
- Aggression = red
- Vigilance = blue
- Command = green
- Cunning = yellow
- Heroism = white
- Villiany = black
Cards with multiple aspects should use have multi coloured bars.
3. When a deck is completely empty, guide the user to first select a leader and base (automatically filter down to leaders and bases). Once a leader and base is selected automatically filter to the aspects of the leader and base combined. The user can still filter to anything else if they choose to, but this default will likely save the user time as most decks do not go off-aspect.
4. Improve visual clarity by introducing card images to the Deck List tab. Use the card image component used in the detailed card pages (or something similar) to display both the leader and base card at the top. Allow the user to switch between the front and back art of the leader card. For all the card rows below, on hover, display the front art of the card the row item is for.
Implemented: PENDING
-----
### Catalog Improvement
1. Support cataloging all card variants. Prestige cards, in multiple tiers, leader showcases and serialised cards and any other variants that exist in SWU.
2. Move all filters and search field to a sidebar. Consider UI components similar to https://swu.fan/cards/. The sidebar is sticky, similar to the side bar in our deckbuilder. Consider that changes here will apply to the deck builder which displays deck information as well. It will also apply to the trade binder.
3. Add Twin Suns set to the catalog. Set Code: TS26
4. Implement a quick-add feature. Through quick-add, users can add pre-constructed decks to their catalogue through a click. This will work for pre-constructed decks like Spotlight Decks and Twin Suns decks. This will not add a deck for the user, it will only update their collection.
Implemented: PENDING
-----
### New Home Page
Move the catalog to it's own dedicated route /cards. Include it in the top nav. Develop a new home page strucutred like this:
(top nav) [Logo] - clickable navigates to hope page, [Catalog] - navigates to the catalog, [Import Collection] - navigates to /collection, [Decks] - navigates to /decks, [Trade Binder] - navigates to the trade binder
(hero) Title: 'Star Wars Unlimited Card Database and Deck Builder', Subtitle: 'Track your collection, build your decks, and begin trading with up to date market prices!'
(Main content sections)
1. Highest Value Cards:
[5x2 Card Image grid] Display the top 10 highest value cards.
2. Begin tracking your collection, automatically highlighting missing cards in your deck so you know what to trade for:
(image of collection tracking, deck builder and trade binder). 3 CTAs:
[Import your Collection], [Build my Decks], [Set my Trade Binder]
Implemented: PENDING
-----
### Trade Binder Improvements
1. /binder/{username} page isn't full width. Make it full width.
2. /binder/{username} cards are difficult to view. Make the grid the same size as the catalog card grid.
3. /binder/manage should also display the automatic wants with an easy control to exclude.
Implemented: PENDING