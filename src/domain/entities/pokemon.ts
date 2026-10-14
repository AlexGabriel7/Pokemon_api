export interface PokemonStats {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
}

/** Dados necessários para registrar uma nova captura (ainda sem id). */
export interface NewPokemonProps extends PokemonStats {
    pokedexId: number;
    name: string;
    types: string[];
    imageUrl: string | null;
    trainerId: string;
    active?: boolean;
}

export interface PokemonProps extends NewPokemonProps {
    id: number;
    active: boolean;
    capturedAt: Date;
}

/** Pokémon capturado por um treinador. */
export class Pokemon {
    public id: number;
    public pokedexId: number;
    public name: string;
    public types: string[];
    public imageUrl: string | null;
    public hp: number;
    public attack: number;
    public defense: number;
    public specialAttack: number;
    public specialDefense: number;
    public speed: number;
    public trainerId: string;
    public active: boolean;
    public capturedAt: Date;

    constructor(props: PokemonProps) {
        this.id = props.id;
        this.pokedexId = props.pokedexId;
        this.name = props.name;
        this.types = props.types;
        this.imageUrl = props.imageUrl;
        this.hp = props.hp;
        this.attack = props.attack;
        this.defense = props.defense;
        this.specialAttack = props.specialAttack;
        this.specialDefense = props.specialDefense;
        this.speed = props.speed;
        this.trainerId = props.trainerId;
        this.active = props.active;
        this.capturedAt = props.capturedAt;
    }
}
