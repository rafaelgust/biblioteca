import { Head, useForm } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { BookCover } from '@/components/book-cover';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Livros', href: '/books' },
    { title: 'Novo Livro', href: '/books/create' },
];

export default function BookCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        author: '',
        isbn: '',
        year: new Date().getFullYear(),
        description: '',
        cover_image: null as File | null,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('cover_image', file);

        if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }

    function removeImage() {
        setData('cover_image', null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/books');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Novo Livro" />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4 lg:p-8">
                <div className="flex items-center gap-4">
                    <Link href="/books">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Heading
                        title="Cadastrar Novo Livro"
                        description="Preencha os dados do livro para adicioná-lo ao acervo."
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            required
                            placeholder="Ex: Dom Casmurro"
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="author">Autor</Label>
                        <Input
                            id="author"
                            value={data.author}
                            onChange={(e) => setData('author', e.target.value)}
                            required
                            placeholder="Ex: Machado de Assis"
                        />
                        <InputError message={errors.author} />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="isbn">ISBN</Label>
                            <Input
                                id="isbn"
                                value={data.isbn}
                                onChange={(e) =>
                                    setData('isbn', e.target.value)
                                }
                                required
                                placeholder="Ex: 978-85-359-0277-1"
                            />
                            <InputError message={errors.isbn} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="year">Ano de Publicação</Label>
                            <Input
                                id="year"
                                type="number"
                                value={data.year}
                                onChange={(e) =>
                                    setData('year', parseInt(e.target.value))
                                }
                                required
                                min={1000}
                                max={new Date().getFullYear()}
                            />
                            <InputError message={errors.year} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Capa do Livro (opcional)</Label>
                        <div className="flex items-start gap-4">
                            {preview ? (
                                <div className="relative">
                                    <div className="h-40 w-28 shrink-0 overflow-hidden rounded-md shadow-sm">
                                        <img
                                            src={preview}
                                            alt="Preview da capa"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <BookCover
                                    title={data.title || 'Livro'}
                                    size="md"
                                />
                            )}
                            <div className="flex flex-1 flex-col gap-2">
                                <label
                                    htmlFor="cover_image"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                >
                                    <ImagePlus className="h-5 w-5" />
                                    <span>
                                        {preview
                                            ? 'Trocar imagem'
                                            : 'Selecionar imagem'}
                                    </span>
                                </label>
                                <input
                                    ref={fileInputRef}
                                    id="cover_image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG ou WebP. Máximo 2MB.
                                </p>
                                <InputError message={errors.cover_image} />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">
                            Descrição (opcional)
                        </Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={4}
                            placeholder="Breve sinopse ou descrição do livro..."
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Salvando...' : 'Cadastrar Livro'}
                        </Button>
                        <Link href="/books">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
