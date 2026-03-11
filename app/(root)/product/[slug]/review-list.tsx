'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Check, StarIcon, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useInView } from 'react-intersection-observer'
import { z } from 'zod'

import Rating from '@/components/shared/product/rating'
import RatingSummary from '@/components/shared/product/rating-summary'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  createUpdateReview,
  getReviewByProductId,
  getReviews,
} from '@/lib/actions/review.actions'
import { IProduct } from '@/lib/db/models/product.model'
import { ReviewInputSchema } from '@/lib/validator'
import { IReviewDetails } from '@/types'

type ReviewFormInput = z.input<typeof ReviewInputSchema>
type ReviewFormOutput = z.output<typeof ReviewInputSchema>

const reviewFormDefaultValues: ReviewFormInput = {
  product: '',
  user: '',
  isVerifiedPurchase: false,
  title: '',
  comment: '',
  rating: 0,
}

export default function ReviewList({
  userId,
  product,
}: {
  userId: string | undefined
  product: IProduct
}) {
  const [page, setPage] = useState(2)
  const [totalPages, setTotalPages] = useState(0)
  const [reviews, setReviews] = useState<IReviewDetails[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [open, setOpen] = useState(false)

  const { ref, inView } = useInView({ triggerOnce: true })
  const { toast } = useToast()

  const form = useForm<ReviewFormInput, unknown, ReviewFormOutput>({
    resolver: zodResolver(ReviewInputSchema),
    defaultValues: reviewFormDefaultValues,
  })

  const reload = async () => {
    try {
      const res = await getReviews({ productId: product._id, page: 1 })
      setReviews([...res.data])
      setTotalPages(res.totalPages)
      setPage(2)
    } catch (err) {
      toast({
        variant: 'destructive',
        description: 'Error in fetching reviews',
      })
    }
  }

  const loadMoreReviews = async () => {
    if (totalPages !== 0 && page > totalPages) return

    try {
      setLoadingReviews(true)
      const res = await getReviews({ productId: product._id, page })
      setReviews((prev) => [...prev, ...res.data])
      setTotalPages(res.totalPages)
      setPage((prev) => prev + 1)
    } catch (err) {
      toast({
        variant: 'destructive',
        description: 'Error in fetching more reviews',
      })
    } finally {
      setLoadingReviews(false)
    }
  }

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoadingReviews(true)
        const res = await getReviews({ productId: product._id, page: 1 })
        setReviews([...res.data])
        setTotalPages(res.totalPages)
      } catch (err) {
        toast({
          variant: 'destructive',
          description: 'Error in fetching reviews',
        })
      } finally {
        setLoadingReviews(false)
      }
    }

    if (inView) {
      loadReviews()
    }
  }, [inView, product._id, toast])

  const onSubmit: SubmitHandler<ReviewFormOutput> = async (values) => {
    const res = await createUpdateReview({
      data: {
        ...values,
        product: product._id,
      },
      path: `/product/${product.slug}`,
    })

    if (!res.success) {
      return toast({
        variant: 'destructive',
        description: res.message,
      })
    }

    setOpen(false)
    await reload()

    toast({
      description: res.message,
    })
  }

  const handleOpenForm = async () => {
    form.reset({
      product: product._id,
      user: userId ?? '',
      isVerifiedPurchase: true,
      title: '',
      comment: '',
      rating: 0,
    })

    const review = await getReviewByProductId({ productId: product._id })

    if (review) {
      form.setValue('title', review.title)
      form.setValue('comment', review.comment)
      form.setValue('rating', review.rating)
    }

    setOpen(true)
  }

  return (
    <div className='space-y-2'>
      {reviews.length === 0 && <div>No reviews yet</div>}

      <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
        <div className='flex flex-col gap-2'>
          {reviews.length !== 0 && (
            <RatingSummary
              avgRating={product.avgRating}
              numReviews={product.numReviews}
              ratingDistribution={product.ratingDistribution}
            />
          )}

          <Separator className='my-3' />

          <div className='space-y-3'>
            <h3 className='text-lg font-bold lg:text-xl'>Review this product</h3>
            <p className='text-sm'>Share your thoughts with other customers</p>

            {userId ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <Button
                  onClick={handleOpenForm}
                  variant='outline'
                  className='w-full rounded-full'
                >
                  Write a customer review
                </Button>

                <DialogContent className='sm:max-w-[425px]'>
                  <Form {...form}>
                    <form method='post' onSubmit={form.handleSubmit(onSubmit)}>
                      <DialogHeader>
                        <DialogTitle>Write a customer review</DialogTitle>
                        <DialogDescription>
                          Share your thoughts with other customers
                        </DialogDescription>
                      </DialogHeader>

                      <div className='grid gap-4 py-4'>
                        <div className='flex flex-col gap-5'>
                          <FormField
                            control={form.control}
                            name='title'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder='Enter title' {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name='comment'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>Comment</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder='Enter comment'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={form.control}
                            name='rating'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rating</FormLabel>
                                <Select
                                  onValueChange={(value) =>
                                    field.onChange(Number(value))
                                  }
                                  value={
                                    field.value !== undefined
                                      ? String(field.value)
                                      : ''
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='Select a rating' />
                                    </SelectTrigger>
                                  </FormControl>

                                  <SelectContent>
                                    {Array.from({ length: 5 }).map((_, index) => (
                                      <SelectItem
                                        key={index}
                                        value={String(index + 1)}
                                      >
                                        <div className='flex items-center gap-1'>
                                          {index + 1}
                                          <StarIcon className='h-4 w-4' />
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type='submit'
                          size='lg'
                          disabled={form.formState.isSubmitting}
                        >
                          {form.formState.isSubmitting
                            ? 'Submitting...'
                            : 'Submit'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            ) : (
              <div>
                Please{' '}
                <Link
                  href={`/sign-in?callbackUrl=/product/${product.slug}`}
                  className='highlight-link'
                >
                  sign in
                </Link>{' '}
                to write a review
              </div>
            )}
          </div>
        </div>

        <div className='md:col-span-3 flex flex-col gap-3'>
          {reviews.map((review: IReviewDetails) => (
            <Card key={review._id}>
              <CardHeader>
                <div className='flex-between'>
                  <CardTitle>{review.title}</CardTitle>
                  <div className='flex text-sm italic'>
                    <Check className='h-4 w-4' /> Verified Purchase
                  </div>
                </div>
                <CardDescription>{review.comment}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className='flex space-x-4 text-sm text-muted-foreground'>
                  <Rating rating={review.rating} />

                  <div className='flex items-center'>
                    <User className='mr-1 h-3 w-3' />
                    {review.user ? review.user.name : 'Deleted User'}
                  </div>

                  <div className='flex items-center'>
                    <Calendar className='mr-1 h-3 w-3' />
                    {review.createdAt.toString().substring(0, 10)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div ref={ref}>
            {page <= totalPages && (
              <Button variant='link' onClick={loadMoreReviews}>
                See more reviews
              </Button>
            )}

            {page < totalPages && loadingReviews && 'Loading'}
          </div>
        </div>
      </div>
    </div>
  )
}