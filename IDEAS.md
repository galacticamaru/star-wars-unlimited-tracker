# IDEAS Document

## What This Is
A document where I catalogue ideas / user stories / features to develop out at a later time.

## Ideas
### Deck of the day:
Pull up a recent PQ or higher winner. Add a mechanism to view the deck, highlighting any cards that are missing from the collection compared to the deck. Allow the user to copy that deck into their library of decks.

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