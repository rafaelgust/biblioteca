<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'isbn' => ['required', 'string', 'max:20', Rule::unique('books', 'isbn')->ignore($this->route('book'))],
            'year' => ['required', 'integer', 'min:1000', 'max:'.date('Y')],
            'description' => ['nullable', 'string', 'max:2000'],
            'cover_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'O título é obrigatório.',
            'author.required' => 'O autor é obrigatório.',
            'isbn.required' => 'O ISBN é obrigatório.',
            'isbn.unique' => 'Este ISBN já está cadastrado.',
            'year.required' => 'O ano é obrigatório.',
            'year.min' => 'O ano deve ser no mínimo 1000.',
            'year.max' => 'O ano não pode ser maior que o ano atual.',
            'cover_image.image' => 'O arquivo deve ser uma imagem.',
            'cover_image.mimes' => 'A imagem deve ser JPG, PNG ou WebP.',
            'cover_image.max' => 'A imagem deve ter no máximo 2MB.',
        ];
    }
}
