export interface UpdateProfileDto {
    fullName?: string;
    email?: string;
    phone?: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
