import type { Request, Response, NextFunction } from 'express';
import { profileCreateSchema, profilePatchSchema } from '../schemas/profile.js';
import {
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
  updateProfile,
} from '../services/profiles.service.js';
import { HttpError } from '../utils/errors.js';
import type { ProfileStatus } from '../types.js';

export function listProfilesHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const { status } = req.query;
    const filter: ProfileStatus | undefined =
      status === 'DRAFT' || status === 'ACTIVE' ? status : undefined;
    res.json({ items: listProfiles(filter) });
  } catch (err) {
    next(err);
  }
}

export function getProfileHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    if (!id) throw new HttpError(400, 'Missing id');
    res.json(getProfile(id));
  } catch (err) {
    next(err);
  }
}

export function createProfileHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const parsed = profileCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid profile', details: parsed.error.format() });
      return;
    }
    const profile = createProfile(parsed.data);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
}

export function patchProfileHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    if (!id) throw new HttpError(400, 'Missing id');
    const parsed = profilePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid patch', details: parsed.error.format() });
      return;
    }
    res.json(updateProfile(id, parsed.data));
  } catch (err) {
    next(err);
  }
}

export function deleteProfileHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    if (!id) throw new HttpError(400, 'Missing id');
    deleteProfile(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
