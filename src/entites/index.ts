export type RawEntry = {
    id: number;
    comment: string;
    created_at: string;
    entry_emotions: {emotions: RawEmotion}[];
};

export class Entry {
    id: number
    comment: string
    createdAt: Date
    emotions: Emotion[]

    constructor(raw: RawEntry) {
        this.id = raw.id;
        this.comment = raw.comment;
        this.createdAt = new Date(raw.created_at);
        this.emotions = raw.entry_emotions.map(entry => new Emotion(entry.emotions));
    }
}

export type RawEmotion = {
    id: number;
    name: string;
    emotion_groups: {
        color: string;
        emoji: string;
    };
}

export class Emotion {
    id: number
    name: string
    color: string

    constructor(raw: RawEmotion) {
        this.id = raw.id;
        this.name = raw.name;
        this.color = raw.emotion_groups.color;
    }
}