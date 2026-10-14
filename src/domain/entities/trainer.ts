export interface TrainerProps {
    id: string;
    name: string;
    createdAt: Date;
}

export class Trainer {
    public id: string;
    public name: string;
    public createdAt: Date;

    constructor(props: TrainerProps) {
        this.id = props.id;
        this.name = props.name;
        this.createdAt = props.createdAt;
    }
}
