import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Problem } from './schemas/problem.schema';
import { ProblemProto } from './interfaces/problem.interface';

/**
 * ProblemService — all business logic for coding challenges.
 * Handles CRUD operations, filtering, and pagination.
 */
@Injectable()
export class ProblemService {
    private readonly logger = new Logger(ProblemService.name);

    constructor(
        @InjectModel(Problem.name) private readonly problemModel: Model<Problem>,
    ) { }

    // ─── Read ─────────────────────────────────────────────────────────

    /** Fetch a single problem by its MongoDB _id */
    async getById(id: string): Promise<ProblemProto | null> {
        const problem = await this.problemModel.findById(id).exec();
        return problem ? this.toProto(problem) : null;
    }

    /** Fetch a single problem by its slug */
    async getBySlug(slug: string): Promise<ProblemProto | null> {
        const problem = await this.problemModel.findOne({ slug }).exec();
        return problem ? this.toProto(problem) : null;
    }

    /** Fetch a paginated, filterable list of problems */
    async getList(category: string, difficulty: string, page: number, limit: number) {
        // Build dynamic filter
        const filter: Record<string, any> = {};
        if (category) filter.category = { $regex: new RegExp(category, 'i') };
        if (difficulty) filter.difficulty = difficulty;

        // Clamp pagination to safe defaults
        const safePage = Math.max(1, page || 1);
        const safeLimit = Math.min(50, Math.max(1, limit || 10));
        const skip = (safePage - 1) * safeLimit;

        const [problems, total] = await Promise.all([
            this.problemModel.find(filter).skip(skip).limit(safeLimit).exec(),
            this.problemModel.countDocuments(filter).exec(),
        ]);

        return {
            problems: problems.map((p) => this.toProto(p)),
            total,
            page: safePage,
            limit: safeLimit,
        };
    }

    // ─── Create ───────────────────────────────────────────────────────

    /** Create a new problem. Throws if slug already exists. */
    async create(data: {
        title: string;
        slug: string;
        difficulty: string;
        category: string;
        description: string;
        templates: { language: string; code: string }[];
        test_cases: { input: string; expected: string }[];
        constraints: string[];
    }): Promise<ProblemProto> {
        // Guard: duplicate slug
        const existing = await this.problemModel.findOne({ slug: data.slug }).exec();
        if (existing) {
            throw new Error(`A problem with slug "${data.slug}" already exists`);
        }

        const problem = await this.problemModel.create(data);
        this.logger.log(`✅ Problem created: "${problem.title}" (${problem._id})`);
        return this.toProto(problem);
    }

    // ─── Update ───────────────────────────────────────────────────────

    /** Partial update — only non-empty fields are changed */
    async update(id: string, data: Record<string, any>): Promise<ProblemProto | null> {
        // Build $set with only truthy fields
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'id') continue; // skip the id field
            if (value && (!Array.isArray(value) || value.length > 0)) {
                fields[key] = value;
            }
        }

        const problem = await this.problemModel
            .findByIdAndUpdate(id, { $set: fields }, { new: true })
            .exec();

        if (!problem) return null;

        this.logger.log(`✅ Problem updated: "${problem.title}" (${problem._id})`);
        return this.toProto(problem);
    }

    // ─── Delete ───────────────────────────────────────────────────────

    /** Delete a problem by ID */
    async delete(id: string) {
        const result = await this.problemModel.findByIdAndDelete(id).exec();
        if (!result) {
            return { success: false, message: `Problem "${id}" not found` };
        }
        this.logger.log(`🗑️ Problem deleted: "${result.title}" (${result._id})`);
        return { success: true, message: 'Problem deleted successfully' };
    }

    // ─── Helper ───────────────────────────────────────────────────────

    /** Convert a Mongoose document to the proto-compatible shape */
    private toProto(problem: Problem): ProblemProto {
        return {
            id: problem._id.toString(),
            title: problem.title,
            slug: problem.slug,
            difficulty: problem.difficulty,
            category: problem.category,
            description: problem.description,
            templates: problem.templates || [],
            test_cases: problem.test_cases || [],
            constraints: problem.constraints || [],
        };
    }
}
