import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// ─── Sub-documents ──────────────────────────────────────────────────

@Schema({ _id: false })
export class TestCase {
    @Prop({ required: true })
    input: string;

    @Prop({ required: true })
    expected: string;
}

@Schema({ _id: false })
export class TemplateEntry {
    @Prop({ required: true })
    language: string;

    @Prop({ required: true })
    code: string;
}

// ─── Main Problem Schema ────────────────────────────────────────────

/**
 * Problem document — a single coding challenge.
 *
 * Example:
 *   title: "Two Sum"
 *   slug: "two-sum"
 *   difficulty: "Easy"
 *   category: "Arrays"
 */
@Schema({ timestamps: true })
export class Problem extends Document {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true, unique: true })
    slug: string;

    @Prop({ required: true, enum: ['Easy', 'Medium', 'Hard'] })
    difficulty: string;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: [TemplateEntry], default: [] })
    templates: TemplateEntry[];

    @Prop({ type: [TestCase], default: [] })
    test_cases: TestCase[];

    @Prop({ type: [String], default: [] })
    constraints: string[];
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);

// Indexes for fast lookups
ProblemSchema.index({ category: 1, difficulty: 1 });
ProblemSchema.index({ slug: 1 }, { unique: true });
