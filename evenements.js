/*
 * AGENDA DE L’AÉRODROME — seul fichier à modifier pour annoncer un événement.
 *
 * Un bloc { ... } par événement, séparés par une virgule, DANS L’ORDRE CHRONOLOGIQUE.
 * Champs :
 *   titre        (obligatoire)
 *   public       (facultatif)  ex. 'Tout public', 'Sur invitation', 'Réservé aux pilotes'
 *   texte        (facultatif)  une ou deux phrases
 *   icone        (facultatif)  un emoji affiché à la place de la date
 *   date         (facultatif)  format AAAA-MM-JJ. Si renseignée, la date s’affiche
 *                              et l’événement disparaît automatiquement une fois passé.
 *                              Sans date, l’événement reste affiché jusqu’à ce qu’on le retire.
 *   fin          (facultatif)  dernier jour, format AAAA-MM-JJ
 *   heure, organisateur, lieu, lien  (facultatifs)
 */

window.AUDACE_EVENEMENTS = [

  {
    icone: '🥂',
    titre: 'Le verre des pilotes',
    public: 'Pilotes et élèves pilotes',
    texte: 'Pour bien commencer l’année, les pilotes et élèves pilotes des clubs de l’aérodrome se retrouvent autour d’un verre.'
  },

  {
    icone: '☕',
    titre: 'Café-croissants de la Charte',
    public: 'Sur invitation',
    texte: 'Un moment d’échange convivial entre les signataires de la Charte de Chavenay : dirigeants des aéroclubs, élus des communes voisines, association de riverains et partenaires institutionnels.'
  },

  {
    icone: '🎨',
    titre: 'Journée des artistes',
    public: 'Tout public',
    texte: 'Peintres, photographes et créateurs s’installent sur l’aérodrome, entre avions et hangars, pour une journée de création ouverte à tous.'
  },

  {
    icone: '🏫',
    titre: 'Les écoliers à l’aérodrome',
    public: 'Scolaires',
    texte: 'Les classes de CM des écoles élémentaires de Villepreux découvrent l’aérodrome, ses avions et ses métiers.'
  },

  {
    icone: '🏛️',
    date: '2027-09-18', fin: '2027-09-19',
    titre: 'Journées européennes du patrimoine',
    public: 'Tout public',
    texte: 'Après plus de 6 000 visiteurs en 2026, l’aérodrome ouvre à nouveau ses portes : avions d’hier et d’aujourd’hui, simulateurs, exposition, vols découverte et rencontres avec les passionnés.'
  }

];
